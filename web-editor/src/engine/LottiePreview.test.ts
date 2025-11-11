import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LottiePreview } from './LottiePreview';
import type { LottieAnimation } from '../models/LottieTypes';

// Mock lottie-web
const mockAnimationInstance = {
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  goToAndStop: vi.fn(),
  goToAndPlay: vi.fn(),
  destroy: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setSpeed: vi.fn(),
  loop: false,
  isPaused: true,
  currentFrame: 0,
  totalFrames: 150,
};

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: vi.fn(() => mockAnimationInstance),
  },
}));

describe('LottiePreview', () => {
  let preview: LottiePreview;
  let container: HTMLDivElement;
  let mockAnimation: LottieAnimation;

  beforeEach(() => {
    preview = new LottiePreview();
    container = document.createElement('div');
    mockAnimation = {
      v: '5.5.7',
      fr: 30,
      ip: 0,
      op: 150,
      w: 800,
      h: 600,
      nm: 'Test Animation',
      ddd: 0,
      assets: [],
      layers: [],
    };

    // Reset mock calls
    vi.clearAllMocks();
    mockAnimationInstance.loop = false;
    mockAnimationInstance.isPaused = true;
    mockAnimationInstance.currentFrame = 0;
  });

  describe('load', () => {
    it('should load animation with default options', () => {
      preview.load(container, mockAnimation);
      expect(preview.isLoaded()).toBe(true);
    });

    it('should load animation with custom renderer', () => {
      preview.load(container, mockAnimation, { renderer: 'canvas' });
      expect(preview.isLoaded()).toBe(true);
    });

    it('should load animation with loop option', () => {
      preview.load(container, mockAnimation, { loop: true });
      expect(preview.isLoaded()).toBe(true);
    });

    it('should load animation with autoplay option', () => {
      preview.load(container, mockAnimation, { autoplay: true });
      expect(preview.isLoaded()).toBe(true);
    });

    it('should destroy previous instance when loading new animation', () => {
      preview.load(container, mockAnimation);
      const destroySpy = mockAnimationInstance.destroy;

      preview.load(container, mockAnimation);
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('playback controls', () => {
    beforeEach(() => {
      preview.load(container, mockAnimation);
    });

    it('should play animation', () => {
      preview.play();
      expect(mockAnimationInstance.play).toHaveBeenCalled();
    });

    it('should pause animation', () => {
      preview.pause();
      expect(mockAnimationInstance.pause).toHaveBeenCalled();
    });

    it('should stop animation', () => {
      preview.stop();
      expect(mockAnimationInstance.stop).toHaveBeenCalled();
    });

    it('should seek to frame', () => {
      preview.goToFrame(50);
      expect(mockAnimationInstance.goToAndStop).toHaveBeenCalledWith(50, true);
    });

    it('should seek to frame without pausing', () => {
      preview.goToFrame(50, false);
      expect(mockAnimationInstance.goToAndPlay).toHaveBeenCalledWith(50, true);
    });

    it('should seek to time', () => {
      preview.goToTime(2.5, 30);
      expect(mockAnimationInstance.goToAndStop).toHaveBeenCalledWith(75, true);
    });

    it('should set playback speed', () => {
      preview.setSpeed(2);
      expect(mockAnimationInstance.setSpeed).toHaveBeenCalledWith(2);
    });

    it('should set loop state', () => {
      preview.setLoop(true);
      expect(mockAnimationInstance.loop).toBe(true);
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      preview.load(container, mockAnimation);
    });

    it('should get current frame', () => {
      mockAnimationInstance.currentFrame = 50;
      expect(preview.getCurrentFrame()).toBe(50);
    });

    it('should get current time', () => {
      mockAnimationInstance.currentFrame = 60;
      expect(preview.getCurrentTime(30)).toBe(2);
    });

    it('should get total frames', () => {
      expect(preview.getTotalFrames()).toBe(150);
    });

    it('should get duration', () => {
      expect(preview.getDuration(30)).toBe(5);
    });

    it('should check if playing', () => {
      mockAnimationInstance.isPaused = false;
      expect(preview.isPlaying()).toBe(true);

      mockAnimationInstance.isPaused = true;
      expect(preview.isPlaying()).toBe(false);
    });

    it('should get animation data', () => {
      const data = preview.getAnimationData();
      expect(data).toEqual(mockAnimation);
    });

    it('should check if loaded', () => {
      expect(preview.isLoaded()).toBe(true);
    });
  });

  describe('event listeners', () => {
    beforeEach(() => {
      preview.load(container, mockAnimation);
    });

    it('should add event listener', () => {
      const callback = vi.fn();
      preview.addEventListener('complete', callback);
      expect(mockAnimationInstance.addEventListener).toHaveBeenCalledWith('complete', callback);
    });

    it('should remove event listener', () => {
      const callback = vi.fn();
      preview.removeEventListener('complete', callback);
      expect(mockAnimationInstance.removeEventListener).toHaveBeenCalledWith('complete', callback);
    });
  });

  describe('destroy', () => {
    it('should destroy animation instance', () => {
      preview.load(container, mockAnimation);
      preview.destroy();
      expect(mockAnimationInstance.destroy).toHaveBeenCalled();
      expect(preview.isLoaded()).toBe(false);
    });

    it('should clear animation data after destroy', () => {
      preview.load(container, mockAnimation);
      preview.destroy();
      expect(preview.getAnimationData()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should not crash when calling methods without loading', () => {
      expect(() => preview.play()).not.toThrow();
      expect(() => preview.pause()).not.toThrow();
      expect(() => preview.stop()).not.toThrow();
      expect(() => preview.goToFrame(50)).not.toThrow();
      expect(() => preview.setSpeed(2)).not.toThrow();
      expect(() => preview.setLoop(true)).not.toThrow();
    });

    it('should return default values when not loaded', () => {
      expect(preview.getCurrentFrame()).toBe(0);
      expect(preview.getCurrentTime(30)).toBe(0);
      expect(preview.getTotalFrames()).toBe(0);
      expect(preview.getDuration(30)).toBe(0);
      expect(preview.isPlaying()).toBe(false);
      expect(preview.getAnimationData()).toBeNull();
      expect(preview.isLoaded()).toBe(false);
    });
  });
});
