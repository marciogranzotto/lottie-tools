import { create } from 'zustand';
import type { Layer } from '../models/Layer';
import type { Keyframe, AnimatableProperty } from '../models/Keyframe';

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
  keyframes: Keyframe[]; // All keyframes in the project
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
  selectLayer: (layerId: string | undefined) => void;

  // Keyframe actions
  addKeyframe: (layerId: string, property: AnimatableProperty, value: number | string, easing?: string) => void;
  deleteKeyframe: (keyframeId: string) => void;
  updateKeyframe: (keyframeId: string, updates: Partial<Keyframe>) => void;
  getKeyframesForLayer: (layerId: string, property?: AnimatableProperty) => Keyframe[];
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
    keyframes: [],
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

  // Keyframe actions
  addKeyframe: (layerId, property, value, easing = 'linear') =>
    set((state) => {
      if (!state.project) return state;

      const newKeyframe: Keyframe = {
        id: `kf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        time: state.project.currentTime,
        property,
        value,
        easing,
      };

      // Check if a keyframe already exists at this time for this layer/property
      const existingIndex = state.project.keyframes.findIndex(
        (kf) =>
          kf.time === newKeyframe.time &&
          kf.property === property &&
          // We need to track which layer this keyframe belongs to
          // For now, we'll store layerId in a custom property (we'll need to extend Keyframe model)
          (kf as any).layerId === layerId
      );

      let keyframes;
      if (existingIndex >= 0) {
        // Update existing keyframe
        keyframes = state.project.keyframes.map((kf, i) =>
          i === existingIndex ? { ...newKeyframe, id: kf.id } : kf
        );
      } else {
        // Add new keyframe with layerId
        keyframes = [...state.project.keyframes, { ...newKeyframe, layerId } as any];
      }

      return {
        project: { ...state.project, keyframes },
      };
    }),

  deleteKeyframe: (keyframeId) =>
    set((state) => {
      if (!state.project) return state;

      const keyframes = state.project.keyframes.filter((kf) => kf.id !== keyframeId);

      return {
        project: { ...state.project, keyframes },
      };
    }),

  updateKeyframe: (keyframeId, updates) =>
    set((state) => {
      if (!state.project) return state;

      const keyframes = state.project.keyframes.map((kf) =>
        kf.id === keyframeId ? { ...kf, ...updates } : kf
      );

      return {
        project: { ...state.project, keyframes },
      };
    }),

  getKeyframesForLayer: (layerId, property?) => {
    const state = useStore.getState();
    if (!state.project) return [];

    return state.project.keyframes
      .filter((kf) => {
        const layerMatches = (kf as any).layerId === layerId;
        const propertyMatches = property ? kf.property === property : true;
        return layerMatches && propertyMatches;
      })
      .sort((a, b) => a.time - b.time);
  },
}));
