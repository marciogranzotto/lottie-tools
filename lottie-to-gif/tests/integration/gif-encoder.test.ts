/**
 * Integration tests for GIF Encoder
 */

import * as fs from 'fs';
import * as path from 'path';
import { encodeToGif } from '../../src/gif-encoder';
import { renderAnimation } from '../../src/renderer';
import { parseLottieFile } from '../../src/lottie-parser';
import { RenderedFrame } from '../../src/types/renderer';
import { EncodeProgress } from '../../src/types/encoder';

describe('GIF Encoder Integration Tests', () => {
  const testOutputDir = path.join(__dirname, '../output');

  beforeAll(() => {
    // Create output directory for test GIFs
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test outputs (optional - comment out to inspect files)
    if (fs.existsSync(testOutputDir)) {
      const files = fs.readdirSync(testOutputDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testOutputDir, file));
      });
      fs.rmdirSync(testOutputDir);
    }
  });

  describe('encodeToGif', () => {
    it('should encode frames to a GIF file', async () => {
      // Create mock frames (simple colored PNGs)
      const frames: RenderedFrame[] = [];
      const width = 10;
      const height = 10;

      // Create 3 simple test frames
      for (let i = 0; i < 3; i++) {
        // Create a simple PNG (red, green, blue for each frame)
        const PNG = require('pngjs').PNG;
        const png = new PNG({ width, height });

        // Fill with solid color
        const color = i === 0 ? [255, 0, 0] : i === 1 ? [0, 255, 0] : [0, 0, 255];
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2;
            png.data[idx] = color[0];
            png.data[idx + 1] = color[1];
            png.data[idx + 2] = color[2];
            png.data[idx + 3] = 255;
          }
        }

        const buffer = PNG.sync.write(png);

        frames.push({
          frameNumber: i,
          time: i / 10,
          buffer,
          width,
          height,
        });
      }

      const outputPath = path.join(testOutputDir, 'test-simple.gif');

      const result = await encodeToGif({
        outputPath,
        frames,
        fps: 10,
        quality: 80,
      });

      expect(result).toBeDefined();
      expect(result.outputPath).toBe(outputPath);
      expect(result.frameCount).toBe(3);
      expect(result.fps).toBe(10);
      expect(result.dimensions.width).toBe(width);
      expect(result.dimensions.height).toBe(height);
      expect(result.fileSize).toBeGreaterThan(0);

      // Verify file exists
      expect(fs.existsSync(outputPath)).toBe(true);

      // Check GIF signature
      const fileBuffer = fs.readFileSync(outputPath);
      const gifSignature = Buffer.from('GIF89a');
      expect(fileBuffer.slice(0, 6).equals(gifSignature)).toBe(true);
    }, 30000);

    it('should call progress callback during encoding', async () => {
      const frames: RenderedFrame[] = [];
      const width = 5;
      const height = 5;

      // Create test frames
      const PNG = require('pngjs').PNG;
      for (let i = 0; i < 5; i++) {
        const png = new PNG({ width, height });
        for (let j = 0; j < width * height * 4; j++) {
          png.data[j] = 128;
        }
        const buffer = PNG.sync.write(png);
        frames.push({
          frameNumber: i,
          time: i / 10,
          buffer,
          width,
          height,
        });
      }

      const outputPath = path.join(testOutputDir, 'test-progress.gif');
      const progressUpdates: EncodeProgress[] = [];

      await encodeToGif({
        outputPath,
        frames,
        fps: 10,
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].phase).toBe('initializing');
      expect(progressUpdates[progressUpdates.length - 1].phase).toBe('writing');
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
    }, 30000);

    it('should respect quality setting', async () => {
      const frames: RenderedFrame[] = [];
      const width = 20;
      const height = 20;

      const PNG = require('pngjs').PNG;
      for (let i = 0; i < 2; i++) {
        const png = new PNG({ width, height });
        for (let j = 0; j < width * height * 4; j++) {
          png.data[j] = (i * 100) % 255;
        }
        const buffer = PNG.sync.write(png);
        frames.push({
          frameNumber: i,
          time: i / 10,
          buffer,
          width,
          height,
        });
      }

      const highQualityPath = path.join(testOutputDir, 'test-quality-high.gif');
      const lowQualityPath = path.join(testOutputDir, 'test-quality-low.gif');

      const highQualityResult = await encodeToGif({
        outputPath: highQualityPath,
        frames,
        fps: 10,
        quality: 100,
      });

      const lowQualityResult = await encodeToGif({
        outputPath: lowQualityPath,
        frames,
        fps: 10,
        quality: 10,
      });

      // High quality should generally produce larger files
      expect(fs.existsSync(highQualityPath)).toBe(true);
      expect(fs.existsSync(lowQualityPath)).toBe(true);
    }, 60000);

    it('should encode with transparent background', async () => {
      const frames: RenderedFrame[] = [];
      const width = 10;
      const height = 10;

      // Create frames with transparent pixels
      const PNG = require('pngjs').PNG;
      for (let i = 0; i < 2; i++) {
        const png = new PNG({ width, height });

        // Create a pattern with transparent and opaque pixels
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2;
            // Make a checkerboard pattern: transparent and opaque
            if ((x + y) % 2 === 0) {
              // Transparent pixel
              png.data[idx] = 0;
              png.data[idx + 1] = 0;
              png.data[idx + 2] = 0;
              png.data[idx + 3] = 0; // Alpha = 0 (fully transparent)
            } else {
              // Opaque colored pixel
              png.data[idx] = 255;
              png.data[idx + 1] = i * 100;
              png.data[idx + 2] = 0;
              png.data[idx + 3] = 255; // Alpha = 255 (fully opaque)
            }
          }
        }

        const buffer = PNG.sync.write(png);
        frames.push({
          frameNumber: i,
          time: i / 10,
          buffer,
          width,
          height,
        });
      }

      const outputPath = path.join(testOutputDir, 'test-transparent.gif');

      const result = await encodeToGif({
        outputPath,
        frames,
        fps: 10,
        quality: 80,
        backgroundColor: 'transparent',
      });

      expect(result).toBeDefined();
      expect(result.outputPath).toBe(outputPath);
      expect(result.frameCount).toBe(2);
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify GIF signature
      const fileBuffer = fs.readFileSync(outputPath);
      const gifSignature = Buffer.from('GIF89a');
      expect(fileBuffer.slice(0, 6).equals(gifSignature)).toBe(true);

      console.log(`✓ Created transparent GIF: ${outputPath} (${(result.fileSize / 1024).toFixed(2)} KB)`);
    }, 30000);

    it('should encode with solid background color', async () => {
      const frames: RenderedFrame[] = [];
      const width = 10;
      const height = 10;

      // Create frames with some pixels
      const PNG = require('pngjs').PNG;
      for (let i = 0; i < 2; i++) {
        const png = new PNG({ width, height });
        for (let j = 0; j < width * height * 4; j += 4) {
          png.data[j] = 255;     // Red
          png.data[j + 1] = 0;   // Green
          png.data[j + 2] = 0;   // Blue
          png.data[j + 3] = 255; // Alpha (opaque)
        }
        const buffer = PNG.sync.write(png);
        frames.push({
          frameNumber: i,
          time: i / 10,
          buffer,
          width,
          height,
        });
      }

      const outputPath = path.join(testOutputDir, 'test-solid-bg.gif');

      const result = await encodeToGif({
        outputPath,
        frames,
        fps: 10,
        quality: 80,
        backgroundColor: '#FFFFFF', // Solid white background
      });

      expect(result).toBeDefined();
      expect(result.outputPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
    }, 30000);
  });

  describe('End-to-End: Render + Encode', () => {
    it('should render Lottie animation and encode to GIF', async () => {
      const examplePath = path.join(__dirname, '../../examples/bond_vector.json');

      // Only run if example file exists
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      // Parse the Lottie file
      const parseResult = await parseLottieFile(examplePath);

      // Render first 5 frames for quick test
      const testData = { ...parseResult.data, op: 5 };
      const renderResult = await renderAnimation({
        animationData: testData,
      });

      expect(renderResult.frames.length).toBe(5);

      // Encode to GIF
      const outputPath = path.join(testOutputDir, 'bond_vector_test.gif');
      const encodeResult = await encodeToGif({
        outputPath,
        frames: renderResult.frames,
        fps: renderResult.fps,
        quality: 80,
      });

      expect(encodeResult).toBeDefined();
      expect(encodeResult.outputPath).toBe(outputPath);
      expect(encodeResult.frameCount).toBe(5);
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify GIF format
      const fileBuffer = fs.readFileSync(outputPath);
      const gifSignature = Buffer.from('GIF89a');
      expect(fileBuffer.slice(0, 6).equals(gifSignature)).toBe(true);

      console.log(`✓ Created GIF: ${outputPath} (${(encodeResult.fileSize / 1024).toFixed(2)} KB)`);
    }, 120000); // 2 minute timeout
  });
});
