import lottie, { AnimationItem } from 'lottie-web';
import type { LottieAnimation } from '../models/LottieTypes';

/**
 * LottiePreview - Wrapper for lottie-web integration
 * Handles loading, playback control, and synchronization with timeline
 */
export class LottiePreview {
  private animationInstance: AnimationItem | null = null;
  private container: HTMLElement | null = null;
  private currentAnimation: LottieAnimation | null = null;

  /**
   * Initialize lottie-web with container and animation data
   */
  load(
    container: HTMLElement,
    animationData: LottieAnimation,
    options?: {
      renderer?: 'svg' | 'canvas' | 'html';
      loop?: boolean;
      autoplay?: boolean;
    }
  ): void {
    // Clean up existing instance
    this.destroy();

    this.container = container;
    this.currentAnimation = animationData;

    try {
      this.animationInstance = lottie.loadAnimation({
        container,
        renderer: options?.renderer || 'svg',
        loop: options?.loop ?? false,
        autoplay: options?.autoplay ?? false,
        animationData,
      });
    } catch (error) {
      console.error('Failed to load lottie animation:', error);
      throw new Error('Failed to load animation. Check console for details.');
    }
  }

  /**
   * Play the animation
   */
  play(): void {
    if (!this.animationInstance) {
      console.warn('No animation instance to play');
      return;
    }
    this.animationInstance.play();
  }

  /**
   * Pause the animation
   */
  pause(): void {
    if (!this.animationInstance) {
      console.warn('No animation instance to pause');
      return;
    }
    this.animationInstance.pause();
  }

  /**
   * Stop the animation and reset to beginning
   */
  stop(): void {
    if (!this.animationInstance) {
      console.warn('No animation instance to stop');
      return;
    }
    this.animationInstance.stop();
  }

  /**
   * Seek to specific frame
   */
  goToFrame(frame: number, pause = true): void {
    if (!this.animationInstance) {
      console.warn('No animation instance to seek');
      return;
    }

    if (pause) {
      this.animationInstance.goToAndStop(frame, true);
    } else {
      this.animationInstance.goToAndPlay(frame, true);
    }
  }

  /**
   * Seek to specific time in seconds
   */
  goToTime(time: number, fps: number, pause = true): void {
    const frame = time * fps;
    this.goToFrame(frame, pause);
  }

  /**
   * Set loop state
   */
  setLoop(loop: boolean): void {
    if (!this.animationInstance) {
      console.warn('No animation instance to set loop');
      return;
    }
    this.animationInstance.loop = loop;
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    if (!this.animationInstance) {
      console.warn('No animation instance to set speed');
      return;
    }
    this.animationInstance.setSpeed(speed);
  }

  /**
   * Get current frame
   */
  getCurrentFrame(): number {
    if (!this.animationInstance) {
      return 0;
    }
    return this.animationInstance.currentFrame;
  }

  /**
   * Get current time in seconds
   */
  getCurrentTime(fps: number): number {
    return this.getCurrentFrame() / fps;
  }

  /**
   * Get total frames
   */
  getTotalFrames(): number {
    if (!this.animationInstance) {
      return 0;
    }
    return this.animationInstance.totalFrames;
  }

  /**
   * Get duration in seconds
   */
  getDuration(fps: number): number {
    return this.getTotalFrames() / fps;
  }

  /**
   * Check if animation is playing
   */
  isPlaying(): boolean {
    if (!this.animationInstance) {
      return false;
    }
    return !this.animationInstance.isPaused;
  }

  /**
   * Register event listener
   */
  addEventListener(
    eventName: 'enterFrame' | 'loopComplete' | 'complete' | 'segmentStart' | 'destroy' | 'config_ready' | 'data_ready' | 'DOMLoaded' | 'loaded_images',
    callback: () => void
  ): void {
    if (!this.animationInstance) {
      console.warn('No animation instance to add event listener');
      return;
    }
    this.animationInstance.addEventListener(eventName, callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    eventName: 'enterFrame' | 'loopComplete' | 'complete' | 'segmentStart' | 'destroy' | 'config_ready' | 'data_ready' | 'DOMLoaded' | 'loaded_images',
    callback: () => void
  ): void {
    if (!this.animationInstance) {
      return;
    }
    this.animationInstance.removeEventListener(eventName, callback);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.animationInstance) {
      this.animationInstance.destroy();
      this.animationInstance = null;
    }
    this.container = null;
    this.currentAnimation = null;
  }

  /**
   * Get current animation data
   */
  getAnimationData(): LottieAnimation | null {
    return this.currentAnimation;
  }

  /**
   * Check if animation is loaded
   */
  isLoaded(): boolean {
    return this.animationInstance !== null;
  }
}
