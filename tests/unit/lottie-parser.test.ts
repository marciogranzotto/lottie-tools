/**
 * Unit tests for Lottie Parser
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  readLottieFile,
  validateLottieData,
  extractMetadata,
  parseLottieFile,
  isValidLottieFile,
} from '../../src/lottie-parser';
import { LottieParseError, LottieAnimation } from '../../src/types/lottie';

describe('Lottie Parser', () => {
  const validLottieData: LottieAnimation = {
    v: '5.7.0',
    fr: 30,
    ip: 0,
    op: 48,
    w: 236,
    h: 89,
    layers: [{ ty: 4, nm: 'Layer 1' }],
  };

  describe('validateLottieData', () => {
    it('should validate correct Lottie data without errors', () => {
      const errors = validateLottieData(validLottieData);
      expect(errors).toHaveLength(0);
    });

    it('should reject non-object data', () => {
      const errors = validateLottieData(null);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('root');
    });

    it('should reject data missing version field', () => {
      const data = { ...validLottieData };
      delete (data as any).v;
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'v')).toBe(true);
    });

    it('should reject data missing frame rate', () => {
      const data = { ...validLottieData };
      delete (data as any).fr;
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'fr')).toBe(true);
    });

    it('should reject data missing width', () => {
      const data = { ...validLottieData };
      delete (data as any).w;
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'w')).toBe(true);
    });

    it('should reject data missing height', () => {
      const data = { ...validLottieData };
      delete (data as any).h;
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'h')).toBe(true);
    });

    it('should reject data missing layers', () => {
      const data = { ...validLottieData };
      delete (data as any).layers;
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'layers')).toBe(true);
    });

    it('should reject negative width', () => {
      const data = { ...validLottieData, w: -100 };
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'w' && e.message.includes('greater than 0'))).toBe(true);
    });

    it('should reject zero height', () => {
      const data = { ...validLottieData, h: 0 };
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'h' && e.message.includes('greater than 0'))).toBe(true);
    });

    it('should reject zero frame rate', () => {
      const data = { ...validLottieData, fr: 0 };
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'fr' && e.message.includes('greater than 0'))).toBe(true);
    });

    it('should reject empty layers array', () => {
      const data = { ...validLottieData, layers: [] };
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'layers' && e.message.includes('cannot be empty'))).toBe(true);
    });

    it('should reject layers that is not an array', () => {
      const data = { ...validLottieData, layers: {} as any };
      const errors = validateLottieData(data);
      expect(errors.some(e => e.field === 'layers' && e.message.includes('must be an array'))).toBe(true);
    });
  });

  describe('extractMetadata', () => {
    it('should extract correct metadata from valid Lottie data', () => {
      const metadata = extractMetadata(validLottieData);

      expect(metadata.version).toBe('5.7.0');
      expect(metadata.width).toBe(236);
      expect(metadata.height).toBe(89);
      expect(metadata.frameRate).toBe(30);
      expect(metadata.inPoint).toBe(0);
      expect(metadata.outPoint).toBe(48);
      expect(metadata.totalFrames).toBe(48);
      expect(metadata.duration).toBe(1.6); // 48 frames / 30 fps = 1.6 seconds
    });

    it('should handle animation with name', () => {
      const data = { ...validLottieData, nm: 'My Animation' };
      const metadata = extractMetadata(data);
      expect(metadata.name).toBe('My Animation');
    });

    it('should calculate duration correctly for different frame rates', () => {
      const data = { ...validLottieData, fr: 60, op: 120 };
      const metadata = extractMetadata(data);
      expect(metadata.duration).toBe(2); // 120 frames / 60 fps = 2 seconds
    });
  });

  describe('readLottieFile', () => {
    const testDir = path.join(__dirname, '../fixtures');
    const validFilePath = path.join(testDir, 'valid.json');
    const invalidJsonPath = path.join(testDir, 'invalid.json');
    const nonExistentPath = path.join(testDir, 'nonexistent.json');

    beforeAll(() => {
      // Create test fixtures directory
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Create valid test file
      fs.writeFileSync(validFilePath, JSON.stringify(validLottieData));

      // Create invalid JSON file
      fs.writeFileSync(invalidJsonPath, '{ invalid json }');
    });

    afterAll(() => {
      // Clean up test files
      if (fs.existsSync(validFilePath)) fs.unlinkSync(validFilePath);
      if (fs.existsSync(invalidJsonPath)) fs.unlinkSync(invalidJsonPath);
      if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    });

    it('should read valid Lottie file successfully', async () => {
      const data = await readLottieFile(validFilePath);
      expect(data).toEqual(validLottieData);
    });

    it('should throw error for non-existent file', async () => {
      await expect(readLottieFile(nonExistentPath)).rejects.toThrow(LottieParseError);
      await expect(readLottieFile(nonExistentPath)).rejects.toThrow('File not found');
    });

    it('should throw error for invalid JSON', async () => {
      await expect(readLottieFile(invalidJsonPath)).rejects.toThrow(LottieParseError);
      await expect(readLottieFile(invalidJsonPath)).rejects.toThrow('Invalid JSON format');
    });

    it('should throw error for directory path', async () => {
      await expect(readLottieFile(testDir)).rejects.toThrow(LottieParseError);
      await expect(readLottieFile(testDir)).rejects.toThrow('not a file');
    });
  });

  describe('parseLottieFile', () => {
    const examplePath = path.join(__dirname, '../../examples/bond_vector.json');

    it('should parse the example Lottie file successfully', async () => {
      // Only run if example file exists
      if (fs.existsSync(examplePath)) {
        const result = await parseLottieFile(examplePath);

        expect(result.data).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.width).toBe(236);
        expect(result.metadata.height).toBe(89);
        expect(result.metadata.frameRate).toBe(30);
      }
    });
  });

  describe('isValidLottieFile', () => {
    const testDir = path.join(__dirname, '../fixtures');
    const validFilePath = path.join(testDir, 'valid-check.json');
    const invalidFilePath = path.join(testDir, 'invalid-check.json');

    beforeAll(() => {
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.writeFileSync(validFilePath, JSON.stringify(validLottieData));
      fs.writeFileSync(invalidFilePath, JSON.stringify({ invalid: 'data' }));
    });

    afterAll(() => {
      if (fs.existsSync(validFilePath)) fs.unlinkSync(validFilePath);
      if (fs.existsSync(invalidFilePath)) fs.unlinkSync(invalidFilePath);
      if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    });

    it('should return true for valid Lottie file', async () => {
      const isValid = await isValidLottieFile(validFilePath);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid Lottie file', async () => {
      const isValid = await isValidLottieFile(invalidFilePath);
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const isValid = await isValidLottieFile('/path/to/nonexistent.json');
      expect(isValid).toBe(false);
    });
  });
});
