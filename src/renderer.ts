/**
 * Lottie Animation Renderer
 * Uses Puppeteer and lottie-web to render animations frame-by-frame
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import {
  RenderOptions,
  RenderResult,
  RenderedFrame,
  RenderProgress,
  RenderError,
} from './types/renderer';

/**
 * Renders a Lottie animation to individual frames
 * @param options - Rendering configuration options
 * @returns Promise resolving to render result with all frames
 */
export async function renderAnimation(options: RenderOptions): Promise<RenderResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Extract options with defaults
    const animationData = options.animationData;
    const width = options.width || animationData.w;
    const height = options.height || animationData.h;
    const fps = options.fps || animationData.fr;
    const timeout = options.timeout || 60000;
    const backgroundColor = options.backgroundColor;
    const onProgress = options.onProgress;

    // Calculate frame information
    const inPoint = animationData.ip ?? 0;
    const outPoint = animationData.op ?? 0;
    const totalFrames = Math.ceil((outPoint - inPoint) * (fps / animationData.fr));
    const duration = (outPoint - inPoint) / animationData.fr;

    // Initialize browser and page
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    page = await browser.newPage();

    // Set viewport to match output dimensions
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    });

    // Load the HTML template
    const templatePath = path.join(__dirname, 'templates', 'lottie-player.html');
    const templateUrl = `file://${templatePath}`;
    await page.goto(templateUrl, { waitUntil: 'networkidle0', timeout });

    // Wait for page to be ready
    await page.waitForFunction('window.pageReady === true', { timeout });

    // Initialize the animation
    const animInfo = await page.evaluate(
      (data: any, w: number, h: number, bgColor?: string) => {
        // @ts-ignore - window is available in browser context
        return window.initAnimation(data, w, h, bgColor);
      },
      animationData,
      width,
      height,
      backgroundColor
    );

    // Render frames
    const frames: RenderedFrame[] = [];

    for (let i = 0; i < totalFrames; i++) {
      // Calculate which animation frame to render
      const animFrame = inPoint + (i * animationData.fr / fps);
      const currentTime = i / fps;

      // Go to the frame
      await page.evaluate((frameNum: number) => {
        // @ts-ignore - window is available in browser context
        window.goToFrame(frameNum);
      }, animFrame);

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Capture the frame
      // Only omit background if we don't have a background color or it's transparent
      const omitBackground = !backgroundColor || backgroundColor === 'transparent';
      const screenshot = await page.screenshot({
        type: 'png',
        clip: {
          x: 0,
          y: 0,
          width,
          height,
        },
        omitBackground,
      });

      frames.push({
        frameNumber: i,
        time: currentTime,
        buffer: screenshot as Buffer,
        width,
        height,
      });

      // Report progress
      if (onProgress) {
        const progress: RenderProgress = {
          currentFrame: i + 1,
          totalFrames,
          percentage: ((i + 1) / totalFrames) * 100,
          currentTime,
          totalDuration: duration,
        };
        onProgress(progress);
      }
    }

    // Cleanup
    await page.evaluate(() => {
      // @ts-ignore - window is available in browser context
      window.destroyAnimation();
    });

    await page.close();
    await browser.close();

    const renderTime = Date.now() - startTime;

    return {
      frames,
      frameCount: frames.length,
      renderTime,
      dimensions: { width, height },
      fps,
    };
  } catch (error) {
    // Cleanup on error
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    throw new RenderError(
      `Failed to render animation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Renders a single frame from a Lottie animation
 * @param options - Rendering configuration options
 * @param frameNumber - Frame number to render (0-indexed)
 * @returns Promise resolving to the rendered frame
 */
export async function renderSingleFrame(
  options: RenderOptions,
  frameNumber: number
): Promise<RenderedFrame> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const animationData = options.animationData;
    const width = options.width || animationData.w;
    const height = options.height || animationData.h;
    const fps = options.fps || animationData.fr;
    const timeout = options.timeout || 60000;
    const backgroundColor = options.backgroundColor;

    const inPoint = animationData.ip ?? 0;
    const animFrame = inPoint + (frameNumber * animationData.fr / fps);
    const currentTime = frameNumber / fps;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    const templatePath = path.join(__dirname, 'templates', 'lottie-player.html');
    const templateUrl = `file://${templatePath}`;
    await page.goto(templateUrl, { waitUntil: 'networkidle0', timeout });

    await page.waitForFunction('window.pageReady === true', { timeout });

    await page.evaluate(
      (data: any, w: number, h: number, bgColor?: string) => {
        // @ts-ignore - window is available in browser context
        return window.initAnimation(data, w, h, bgColor);
      },
      animationData,
      width,
      height,
      backgroundColor
    );

    await page.evaluate((frame: number) => {
      // @ts-ignore - window is available in browser context
      window.goToFrame(frame);
    }, animFrame);

    await new Promise(resolve => setTimeout(resolve, 50));

    const omitBackground = !backgroundColor || backgroundColor === 'transparent';
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height },
      omitBackground,
    });

    await page.evaluate(() => {
      // @ts-ignore - window is available in browser context
      window.destroyAnimation();
    });

    await page.close();
    await browser.close();

    return {
      frameNumber,
      time: currentTime,
      buffer: screenshot as Buffer,
      width,
      height,
    };
  } catch (error) {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore
      }
    }

    throw new RenderError(
      `Failed to render frame ${frameNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}
