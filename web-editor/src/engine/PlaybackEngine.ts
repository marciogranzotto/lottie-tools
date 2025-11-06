/**
 * Configuration for PlaybackEngine
 */
export interface PlaybackEngineConfig {
  fps?: number;
  duration?: number;
  loop?: boolean;
  onUpdate: (currentTime: number) => void;
}

/**
 * PlaybackEngine handles animation playback timing and updates
 */
export class PlaybackEngine {
  private fps: number;
  private duration: number;
  private loop: boolean;
  private onUpdate: (currentTime: number) => void;

  private currentTime: number = 0;
  private playing: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;

  constructor(config: PlaybackEngineConfig) {
    this.fps = config.fps || 30;
    this.duration = config.duration || 5;
    this.loop = config.loop !== undefined ? config.loop : false;
    this.onUpdate = config.onUpdate;
  }

  /**
   * Start playback
   */
  play(): void {
    if (this.playing) return;

    // Don't play if duration is zero or at end
    if (this.duration === 0 || this.currentTime >= this.duration) {
      return;
    }

    this.playing = true;
    this.lastFrameTime = performance.now();
    this.tick();
  }

  /**
   * Pause playback (keeps current time)
   */
  pause(): void {
    this.playing = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Stop playback (resets to beginning)
   */
  stop(): void {
    this.playing = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.currentTime = 0;
    this.onUpdate(this.currentTime);
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    this.currentTime = this.clampTime(time);
    this.onUpdate(this.currentTime);
  }

  /**
   * Step forward one frame
   */
  stepForward(): void {
    const frameTime = 1 / this.fps;
    this.seek(this.currentTime + frameTime);
  }

  /**
   * Step backward one frame
   */
  stepBackward(): void {
    const frameTime = 1 / this.fps;
    this.seek(this.currentTime - frameTime);
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Set FPS
   */
  setFps(fps: number): void {
    this.fps = fps;
  }

  /**
   * Set duration
   */
  setDuration(duration: number): void {
    this.duration = duration;
    // Clamp current time if it exceeds new duration
    if (this.currentTime > duration) {
      this.currentTime = duration;
      this.onUpdate(this.currentTime);
    }
  }

  /**
   * Set loop mode
   */
  setLoop(loop: boolean): void {
    this.loop = loop;
  }

  /**
   * Main animation loop
   */
  private tick = (): void => {
    if (!this.playing) return;

    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;

    // Update current time
    this.currentTime += deltaTime;

    // Handle end of animation
    if (this.currentTime >= this.duration) {
      if (this.loop) {
        // Loop back to beginning
        this.currentTime = this.currentTime % this.duration;
      } else {
        // Stop at end
        this.currentTime = this.duration;
        this.playing = false;
        this.onUpdate(this.currentTime);
        return;
      }
    }

    // Call update callback
    this.onUpdate(this.currentTime);

    // Schedule next frame
    if (this.playing) {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  };

  /**
   * Clamp time to valid range
   */
  private clampTime(time: number): number {
    return Math.max(0, Math.min(time, this.duration));
  }
}
