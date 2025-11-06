import type { Layer } from './Layer';

/**
 * Project settings
 */
export interface ProjectSettings {
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  backgroundColor?: string;
}

/**
 * Complete project data
 */
export interface Project {
  settings: ProjectSettings;
  layers: Layer[];
  selectedLayerId?: string;
  currentTime: number;
  isPlaying: boolean;
}
