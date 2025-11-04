/**
 * Integration tests for Lottie Renderer
 * These tests actually render animations and may take longer to run
 */

import * as fs from 'fs';
import * as path from 'path';
import { renderAnimation, renderSingleFrame } from '../../src/renderer';
import { parseLottieFile } from '../../src/lottie-parser';
import { LottieAnimation } from '../../src/types/lottie';
import { RenderProgress } from '../../src/types/renderer';

describe('Lottie Renderer Integration Tests', () => {
  // Simple test animation data
  const simpleAnimation: LottieAnimation = {
    v: '5.7.0',
    fr: 30,
    ip: 0,
    op: 60, // 2 seconds at 30fps
    w: 100,
    h: 100,
    layers: [
      {
        ty: 4,
        nm: 'Shape Layer',
        shapes: [
          {
            ty: 'rc',
            d: 1,
            s: { a: 0, k: [50, 50] },
            p: { a: 0, k: [0, 0] },
            r: { a: 0, k: 0 },
          },
          {
            ty: 'fl',
            c: { a: 0, k: [1, 0, 0, 1] },
          },
        ],
        ks: {
          a: { a: 0, k: [50, 50] },
          p: { a: 0, k: [50, 50] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
      },
    ],
  };

  describe('renderAnimation', () => {
    it('should render a simple animation with correct frame count', async () => {
      const result = await renderAnimation({
        animationData: simpleAnimation,
      });

      expect(result).toBeDefined();
      expect(result.frameCount).toBe(60); // 2 seconds * 30fps
      expect(result.frames).toHaveLength(60);
      expect(result.dimensions.width).toBe(100);
      expect(result.dimensions.height).toBe(100);
      expect(result.fps).toBe(30);
    }, 60000); // 60 second timeout for rendering

    it('should render with custom dimensions', async () => {
      const result = await renderAnimation({
        animationData: simpleAnimation,
        width: 200,
        height: 200,
      });

      expect(result.dimensions.width).toBe(200);
      expect(result.dimensions.height).toBe(200);
      expect(result.frames[0].width).toBe(200);
      expect(result.frames[0].height).toBe(200);
    }, 60000);

    it('should render with custom frame rate', async () => {
      const result = await renderAnimation({
        animationData: simpleAnimation,
        fps: 15, // Half the original frame rate
      });

      // 2 seconds * 15fps = 30 frames
      expect(result.frameCount).toBe(30);
      expect(result.fps).toBe(15);
    }, 60000);

    it('should call progress callback during rendering', async () => {
      const progressUpdates: RenderProgress[] = [];

      await renderAnimation({
        animationData: simpleAnimation,
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].currentFrame).toBe(1);
      expect(progressUpdates[0].totalFrames).toBe(60);
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
    }, 60000);

    it('should render frames as PNG buffers', async () => {
      const result = await renderAnimation({
        animationData: simpleAnimation,
      });

      const firstFrame = result.frames[0];
      expect(Buffer.isBuffer(firstFrame.buffer)).toBe(true);
      expect(firstFrame.buffer.length).toBeGreaterThan(0);

      // Check PNG signature
      const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      expect(firstFrame.buffer.slice(0, 4).equals(pngSignature)).toBe(true);
    }, 60000);

    it('should include correct frame metadata', async () => {
      const result = await renderAnimation({
        animationData: simpleAnimation,
      });

      const frame = result.frames[30]; // Middle frame
      expect(frame.frameNumber).toBe(30);
      expect(frame.time).toBeCloseTo(1.0, 2); // 1 second (30 frames / 30fps)
      expect(frame.width).toBe(100);
      expect(frame.height).toBe(100);
    }, 60000);
  });

  describe('renderSingleFrame', () => {
    it('should render a single frame', async () => {
      const frame = await renderSingleFrame(
        {
          animationData: simpleAnimation,
        },
        0 // First frame
      );

      expect(frame).toBeDefined();
      expect(frame.frameNumber).toBe(0);
      expect(frame.time).toBe(0);
      expect(Buffer.isBuffer(frame.buffer)).toBe(true);
      expect(frame.width).toBe(100);
      expect(frame.height).toBe(100);
    }, 30000);

    it('should render a specific frame number', async () => {
      const frame = await renderSingleFrame(
        {
          animationData: simpleAnimation,
        },
        15 // Frame 15
      );

      expect(frame.frameNumber).toBe(15);
      expect(frame.time).toBeCloseTo(0.5, 2); // 15 frames / 30fps = 0.5 seconds
    }, 30000);
  });

  describe('Real Lottie File', () => {
    const examplePath = path.join(__dirname, '../../examples/bond_vector.json');

    it('should render the example Lottie file', async () => {
      // Only run if example file exists
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const parseResult = await parseLottieFile(examplePath);

      const result = await renderAnimation({
        animationData: parseResult.data,
      });

      expect(result).toBeDefined();
      expect(result.frameCount).toBe(parseResult.metadata.totalFrames);
      expect(result.dimensions.width).toBe(parseResult.metadata.width);
      expect(result.dimensions.height).toBe(parseResult.metadata.height);
      expect(result.fps).toBe(parseResult.metadata.frameRate);

      // Verify all frames are valid PNG images
      for (const frame of result.frames) {
        expect(Buffer.isBuffer(frame.buffer)).toBe(true);
        const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
        expect(frame.buffer.slice(0, 4).equals(pngSignature)).toBe(true);
      }
    }, 120000); // 2 minute timeout for real file
  });
});
