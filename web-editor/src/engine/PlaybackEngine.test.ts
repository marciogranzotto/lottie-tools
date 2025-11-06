import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlaybackEngine, PlaybackEngineConfig } from './PlaybackEngine';

describe('PlaybackEngine', () => {
  let engine: PlaybackEngine;
  let onUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onUpdate = vi.fn();
    vi.useFakeTimers();
    // Ensure clean state
    if (engine) {
      engine.stop();
    }
  });

  afterEach(() => {
    if (engine) {
      engine.stop();
    }
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct config', () => {
      const config: PlaybackEngineConfig = {
        fps: 30,
        duration: 5,
        loop: false,
        onUpdate,
      };

      engine = new PlaybackEngine(config);

      expect(engine.isPlaying()).toBe(false);
      expect(engine.getCurrentTime()).toBe(0);
    });

    it('should initialize with default values', () => {
      engine = new PlaybackEngine({ onUpdate });

      expect(engine.isPlaying()).toBe(false);
      expect(engine.getCurrentTime()).toBe(0);
    });
  });

  describe('Playback Control', () => {
    beforeEach(() => {
      engine = new PlaybackEngine({
        fps: 30,
        duration: 3,
        loop: false,
        onUpdate,
      });
    });

    it('should start playback', () => {
      engine.play();

      expect(engine.isPlaying()).toBe(true);
    });

    it('should stop playback', () => {
      engine.play();
      engine.stop();

      expect(engine.isPlaying()).toBe(false);
    });

    it('should pause playback', () => {
      engine.play();
      vi.advanceTimersByTime(500);
      engine.pause();

      expect(engine.isPlaying()).toBe(false);
      expect(engine.getCurrentTime()).toBeGreaterThan(0);
    });

    it('should resume from paused position', () => {
      engine.play();
      vi.advanceTimersByTime(1000);
      engine.pause();

      const pausedTime = engine.getCurrentTime();

      engine.play();
      vi.advanceTimersByTime(1000);

      expect(engine.getCurrentTime()).toBeGreaterThan(pausedTime);
    });

    it('should reset to beginning on stop', () => {
      engine.play();
      vi.advanceTimersByTime(1000);
      engine.stop();

      expect(engine.getCurrentTime()).toBe(0);
    });
  });

  describe('Time Updates', () => {
    beforeEach(() => {
      engine = new PlaybackEngine({
        fps: 30,
        duration: 3,
        loop: false,
        onUpdate,
      });
    });

    it('should update time during playback', () => {
      engine.play();

      vi.advanceTimersByTime(1000);

      expect(engine.getCurrentTime()).toBeCloseTo(1, 1);
    });

    it('should call onUpdate callback during playback', () => {
      engine.play();

      vi.advanceTimersByTime(100);

      expect(onUpdate).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should stop at duration end when not looping', () => {
      engine.play();

      vi.advanceTimersByTime(4000); // Exceed duration

      expect(engine.isPlaying()).toBe(false);
      expect(engine.getCurrentTime()).toBe(3);
    });
  });

  describe('Looping', () => {
    beforeEach(() => {
      engine = new PlaybackEngine({
        fps: 30,
        duration: 2,
        loop: true,
        onUpdate,
      });
    });

    it('should restart from beginning when reaching end with loop enabled', () => {
      engine.play();

      vi.advanceTimersByTime(2500);

      expect(engine.isPlaying()).toBe(true);
      expect(engine.getCurrentTime()).toBeLessThan(1);
    });

    it('should toggle loop setting', () => {
      engine.setLoop(false);

      engine.play();
      vi.advanceTimersByTime(3000);

      expect(engine.isPlaying()).toBe(false);
    });
  });

  describe('Seek', () => {
    beforeEach(() => {
      engine = new PlaybackEngine({
        fps: 30,
        duration: 5,
        loop: false,
        onUpdate,
      });
    });

    it('should seek to specific time', () => {
      engine.seek(2.5);

      expect(engine.getCurrentTime()).toBe(2.5);
    });

    it('should clamp seek time to valid range', () => {
      engine.seek(-1);
      expect(engine.getCurrentTime()).toBe(0);

      engine.seek(10);
      expect(engine.getCurrentTime()).toBe(5);
    });

    it('should call onUpdate when seeking', () => {
      engine.seek(1.5);

      expect(onUpdate).toHaveBeenCalledWith(1.5);
    });

    it('should continue playback after seeking', () => {
      engine.play();
      engine.seek(1);

      vi.advanceTimersByTime(1000);

      expect(engine.getCurrentTime()).toBeCloseTo(2, 1);
      expect(engine.isPlaying()).toBe(true);
    });
  });

  describe('FPS and Duration Changes', () => {
    beforeEach(() => {
      engine = new PlaybackEngine({
        fps: 30,
        duration: 3,
        loop: false,
        onUpdate,
      });
    });

    it('should update FPS setting', () => {
      engine.setFps(60);

      engine.play();
      vi.advanceTimersByTime(1000);

      // Higher FPS should result in smoother updates
      expect(onUpdate).toHaveBeenCalled();
    });

    it('should update duration setting', () => {
      engine.play();
      vi.advanceTimersByTime(3500);

      expect(engine.isPlaying()).toBe(false);

      engine.setDuration(5);
      engine.play();
      vi.advanceTimersByTime(1500); // Advance 1.5s more (total 4.5s < 5s)

      expect(engine.isPlaying()).toBe(true);
    });

    it('should clamp current time when duration decreases', () => {
      engine.seek(2.5);
      engine.setDuration(2);

      expect(engine.getCurrentTime()).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it.skip('should handle zero duration', () => {
      engine = new PlaybackEngine({
        fps: 30,
        duration: 0,
        loop: false,
        onUpdate,
      });

      engine.play();

      expect(engine.isPlaying()).toBe(false);
    });

    it('should handle very high FPS', () => {
      engine = new PlaybackEngine({
        fps: 120,
        duration: 1,
        loop: false,
        onUpdate,
      });

      engine.play();
      vi.advanceTimersByTime(500);

      expect(engine.getCurrentTime()).toBeCloseTo(0.5, 1);
    });

    it('should handle multiple play calls', () => {
      engine = new PlaybackEngine({
        fps: 30,
        duration: 3,
        loop: false,
        onUpdate,
      });

      engine.play();
      engine.play();
      engine.play();

      expect(engine.isPlaying()).toBe(true);
    });

    it('should handle multiple stop calls', () => {
      engine = new PlaybackEngine({
        fps: 30,
        duration: 3,
        loop: false,
        onUpdate,
      });

      engine.stop();
      engine.stop();

      expect(engine.isPlaying()).toBe(false);
    });
  });

  describe('Frame Stepping', () => {
    beforeEach(() => {
      engine = new PlaybackEngine({
        fps: 30,
        duration: 3,
        loop: false,
        onUpdate,
      });
    });

    it('should step forward one frame', () => {
      const initialTime = engine.getCurrentTime();

      engine.stepForward();

      const expectedTime = initialTime + 1 / 30;
      expect(engine.getCurrentTime()).toBeCloseTo(expectedTime, 3);
    });

    it('should step backward one frame', () => {
      engine.seek(1);

      engine.stepBackward();

      const expectedTime = 1 - 1 / 30;
      expect(engine.getCurrentTime()).toBeCloseTo(expectedTime, 3);
    });

    it('should not step backward below zero', () => {
      engine.seek(0);

      engine.stepBackward();

      expect(engine.getCurrentTime()).toBe(0);
    });

    it('should not step forward beyond duration', () => {
      engine.seek(3);

      engine.stepForward();

      expect(engine.getCurrentTime()).toBe(3);
    });

    it('should call onUpdate when stepping', () => {
      engine.stepForward();

      expect(onUpdate).toHaveBeenCalled();
    });
  });
});
