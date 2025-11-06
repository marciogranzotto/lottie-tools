import { create } from 'zustand';
import { Layer } from '../models/Layer';

/**
 * Project state interface
 */
interface ProjectState {
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  layers: Layer[];
  selectedLayerId?: string;
}

/**
 * Store interface
 */
interface Store {
  // Project state
  project: ProjectState | null;

  // Actions
  setProject: (project: ProjectState) => void;
  updateProjectSettings: (settings: Partial<ProjectState>) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  selectLayer: (layerId: string) => void;
}

/**
 * Main application store
 */
export const useStore = create<Store>((set) => ({
  // Initial state
  project: {
    name: 'Untitled Project',
    width: 800,
    height: 600,
    fps: 30,
    duration: 5,
    currentTime: 0,
    isPlaying: false,
    layers: [],
  },

  // Actions
  setProject: (project) => set({ project }),

  updateProjectSettings: (settings) =>
    set((state) => ({
      project: state.project ? { ...state.project, ...settings } : null,
    })),

  setCurrentTime: (time) =>
    set((state) => ({
      project: state.project ? { ...state.project, currentTime: time } : null,
    })),

  setIsPlaying: (playing) =>
    set((state) => ({
      project: state.project ? { ...state.project, isPlaying: playing } : null,
    })),

  toggleLayerVisibility: (layerId) =>
    set((state) => {
      if (!state.project) return state;

      const layers = state.project.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      );

      return {
        project: { ...state.project, layers },
      };
    }),

  toggleLayerLock: (layerId) =>
    set((state) => {
      if (!state.project) return state;

      const layers = state.project.layers.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      );

      return {
        project: { ...state.project, layers },
      };
    }),

  selectLayer: (layerId) =>
    set((state) => ({
      project: state.project ? { ...state.project, selectedLayerId: layerId } : null,
    })),
}));
