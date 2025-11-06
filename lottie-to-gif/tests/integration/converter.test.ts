/**
 * Integration tests for Lottie to GIF Converter
 */

import * as fs from 'fs';
import * as path from 'path';
import { convertLottieToGif, validateConfig } from '../../src/converter';
import { ConversionProgress } from '../../src/types/config';

describe('Lottie to GIF Converter Integration Tests', () => {
  const testOutputDir = path.join(__dirname, '../output');

  beforeAll(() => {
    // Create output directory
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test outputs (comment out to inspect files)
    if (fs.existsSync(testOutputDir)) {
      const files = fs.readdirSync(testOutputDir);
      files.forEach((file) => {
        if (file.endsWith('.gif')) {
          fs.unlinkSync(path.join(testOutputDir, file));
        }
      });
    }
  });

  describe('validateConfig', () => {
    it('should validate valid configuration', () => {
      expect(() => {
        validateConfig({ input: 'test.json' });
      }).not.toThrow();
    });

    it('should throw error for missing input', () => {
      expect(() => {
        validateConfig({ input: '' });
      }).toThrow('Input file path is required');
    });

    it('should throw error for invalid fps', () => {
      expect(() => {
        validateConfig({ input: 'test.json', fps: 0 });
      }).toThrow('FPS must be greater than 0');
    });

    it('should throw error for invalid width', () => {
      expect(() => {
        validateConfig({ input: 'test.json', width: -100 });
      }).toThrow('Width must be greater than 0');
    });

    it('should throw error for invalid quality', () => {
      expect(() => {
        validateConfig({ input: 'test.json', quality: 150 });
      }).toThrow('Quality must be between 1 and 100');
    });
  });

  describe('convertLottieToGif', () => {
    const examplePath = path.join(__dirname, '../../examples/bond_vector.json');

    it('should convert Lottie file to GIF with default settings', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const outputPath = path.join(testOutputDir, 'converter-test-default.gif');

      const result = await convertLottieToGif({
        input: examplePath,
        output: outputPath,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(result.inputPath).toBe(examplePath);
      expect(result.outputPath).toBe(outputPath);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.parseTime).toBeGreaterThan(0);
      expect(result.renderTime).toBeGreaterThan(0);
      expect(result.encodeTime).toBeGreaterThan(0);

      // Verify source metadata
      expect(result.source.width).toBe(236);
      expect(result.source.height).toBe(89);
      expect(result.source.frameRate).toBe(30);

      // Verify output metadata
      expect(result.output.width).toBe(236);
      expect(result.output.height).toBe(89);
      expect(result.output.frameRate).toBe(30);
      expect(result.output.frameCount).toBe(48);

      // Verify file exists
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify GIF format
      const fileBuffer = fs.readFileSync(outputPath);
      const gifSignature = Buffer.from('GIF89a');
      expect(fileBuffer.slice(0, 6).equals(gifSignature)).toBe(true);
    }, 120000); // 2 minute timeout

    it('should convert with custom dimensions', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const outputPath = path.join(testOutputDir, 'converter-test-custom-size.gif');

      const result = await convertLottieToGif({
        input: examplePath,
        output: outputPath,
        width: 400,
        height: 150,
        verbose: false,
      });

      expect(result.output.width).toBe(400);
      expect(result.output.height).toBe(150);
      expect(fs.existsSync(outputPath)).toBe(true);
    }, 120000);

    it('should convert with custom frame rate', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const outputPath = path.join(testOutputDir, 'converter-test-custom-fps.gif');

      const result = await convertLottieToGif({
        input: examplePath,
        output: outputPath,
        fps: 15, // Half the original rate
        verbose: false,
      });

      expect(result.output.frameRate).toBe(15);
      expect(result.output.frameCount).toBe(24); // Half the frames
      expect(fs.existsSync(outputPath)).toBe(true);
    }, 120000);

    it('should report progress during conversion', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const outputPath = path.join(testOutputDir, 'converter-test-progress.gif');
      const progressUpdates: ConversionProgress[] = [];

      await convertLottieToGif({
        input: examplePath,
        output: outputPath,
        verbose: false,
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);

      // Check we have all phases
      const phases = progressUpdates.map((p) => p.phase);
      expect(phases).toContain('parsing');
      expect(phases).toContain('rendering');
      expect(phases).toContain('encoding');
      expect(phases).toContain('complete');

      // Check progress goes from 0 to 100
      expect(progressUpdates[0].percentage).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
      expect(progressUpdates[progressUpdates.length - 1].phase).toBe('complete');
    }, 120000);

    it('should support verbose logging', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const outputPath = path.join(testOutputDir, 'converter-test-verbose.gif');

      // Capture console.log output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = jest.fn((...args) => {
        logs.push(args.join(' '));
      });

      await convertLottieToGif({
        input: examplePath,
        output: outputPath,
        verbose: true,
      });

      // Restore console.log
      console.log = originalLog;

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.includes('Phase 1'))).toBe(true);
      expect(logs.some((log) => log.includes('Phase 2'))).toBe(true);
      expect(logs.some((log) => log.includes('Phase 3'))).toBe(true);
    }, 120000);

    it('should throw error for non-existent file', async () => {
      await expect(
        convertLottieToGif({
          input: '/path/to/nonexistent.json',
        })
      ).rejects.toThrow('Input file not found');
    });

    it('should use default output path if not specified', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      // Create a copy of the example file in test output dir
      const testInputPath = path.join(testOutputDir, 'test-input.json');
      fs.copyFileSync(examplePath, testInputPath);

      const result = await convertLottieToGif({
        input: testInputPath,
        verbose: false,
      });

      // Default output path is now output/<filename>.gif
      const expectedOutput = path.join('output', 'test-input.gif');
      expect(result.outputPath).toBe(expectedOutput);
      expect(fs.existsSync(expectedOutput)).toBe(true);

      // Cleanup
      fs.unlinkSync(testInputPath);
      fs.unlinkSync(expectedOutput);
    }, 120000);

    it('should support scaled option', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const outputPath = path.join(testOutputDir, 'converter-test-scaled.gif');

      const result = await convertLottieToGif({
        input: examplePath,
        output: outputPath,
        scaled: 2, // 2x size
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(result.outputPath).toBe(outputPath);
      // Output dimensions should be 2x the source dimensions
      expect(result.output.width).toBe(result.source.width * 2);
      expect(result.output.height).toBe(result.source.height * 2);
      expect(fs.existsSync(outputPath)).toBe(true);

      console.log(`✓ Created scaled GIF: ${outputPath} (${(result.fileSize / 1024).toFixed(2)} KB)`);
    }, 120000);

    it('should support transparent background', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const outputPath = path.join(testOutputDir, 'converter-test-transparent.gif');

      const result = await convertLottieToGif({
        input: examplePath,
        output: outputPath,
        backgroundColor: 'transparent',
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(result.outputPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      console.log(`✓ Created transparent GIF: ${outputPath} (${(result.fileSize / 1024).toFixed(2)} KB)`);
    }, 120000);

    it('should support solid background color', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const outputPath = path.join(testOutputDir, 'converter-test-white-bg.gif');

      const result = await convertLottieToGif({
        input: examplePath,
        output: outputPath,
        backgroundColor: 'FFFFFF', // White background
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(result.outputPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      console.log(`✓ Created white background GIF: ${outputPath} (${(result.fileSize / 1024).toFixed(2)} KB)`);
    }, 120000);

    it('should support combined scaled and background color', async () => {
      if (!fs.existsSync(examplePath)) {
        console.log('Skipping: example file not found');
        return;
      }

      const outputPath = path.join(testOutputDir, 'converter-test-scaled-bg.gif');

      const result = await convertLottieToGif({
        input: examplePath,
        output: outputPath,
        scaled: 1.5,
        backgroundColor: '0000FF', // Blue background
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(result.outputPath).toBe(outputPath);
      expect(result.output.width).toBe(Math.round(result.source.width * 1.5));
      expect(result.output.height).toBe(Math.round(result.source.height * 1.5));
      expect(fs.existsSync(outputPath)).toBe(true);

      console.log(`✓ Created scaled + blue background GIF: ${outputPath} (${(result.fileSize / 1024).toFixed(2)} KB)`);
    }, 120000);
  });
});
