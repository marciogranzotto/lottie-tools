import { create } from 'zustand';
import type { Layer } from '../models/Layer';
import type { Keyframe, AnimatableProperty } from '../models/Keyframe';

const STORAGE_KEY = 'lottie-project-autosave';

/**
 * Project state interface
 */
interface ProjectState {
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  loop: boolean;
  currentTime: number;
  isPlaying: boolean;
  layers: Layer[];
  selectedLayerId?: string;
  selectedLayerIds: string[]; // For multi-selection
  keyframes: Keyframe[]; // All keyframes in the project
}

/**
 * Store interface
 */
interface Store {
  // Project state
  project: ProjectState | null;

  // UI state (not persisted)
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  timelineZoom: number;
  previewMode: 'editor' | 'lottie' | 'comparison';
  expandedGroupIds: string[]; // Track which groups are expanded in layers panel

  // Actions
  setProject: (project: ProjectState) => void;
  updateProjectSettings: (settings: Partial<ProjectState>) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleLoop: () => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  selectLayer: (layerId: string | undefined) => void;
  toggleLayerSelection: (layerId: string) => void;
  setSelectedLayerIds: (layerIds: string[]) => void;
  renameLayer: (layerId: string, newName: string) => void;
  deleteLayer: (layerId: string) => void;
  deleteLayers: (layerIds: string[]) => void;

  // Keyframe actions
  addKeyframe: (layerId: string, property: AnimatableProperty, value: number | string, easing?: string) => void;
  deleteKeyframe: (keyframeId: string) => void;
  updateKeyframe: (keyframeId: string, updates: Partial<Keyframe>) => void;
  getKeyframesForLayer: (layerId: string, property?: AnimatableProperty) => Keyframe[];

  // Canvas view actions
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number; y: number }) => void;
  resetCanvasView: () => void;

  // Timeline view actions
  setTimelineZoom: (zoom: number) => void;
  resetTimelineView: () => void;

  // Preview actions
  setPreviewMode: (mode: 'editor' | 'lottie' | 'comparison') => void;

  // Group expansion actions
  toggleGroupExpanded: (groupId: string) => void;

  // Project management
  resetProject: () => void;
}

/**
 * Load project from localStorage
 */
function loadProjectFromStorage(): ProjectState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load project from localStorage:', error);
  }
  return null;
}

/**
 * Default project state
 */
const defaultProject: ProjectState = {
  name: 'Untitled Project',
  width: 800,
  height: 600,
  fps: 30,
  duration: 5,
  loop: true,
  currentTime: 0,
  isPlaying: false,
  layers: [],
  selectedLayerIds: [],
  keyframes: [],
};

/**
 * Main application store
 */
export const useStore = create<Store>((set) => ({
  // Initial state - load from localStorage or use default
  project: loadProjectFromStorage() || defaultProject,

  // UI state
  canvasZoom: 1.0,
  canvasPan: { x: 0, y: 0 },
  timelineZoom: 1.0,
  previewMode: 'editor',
  expandedGroupIds: [],

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

  toggleLoop: () =>
    set((state) => ({
      project: state.project ? { ...state.project, loop: !state.project.loop } : null,
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
    set((state) => {
      if (!state.project) return state;

      // Auto-expand all parent groups when selecting a layer
      const expandedGroupIds = [...state.expandedGroupIds];
      if (layerId) {
        let currentLayer = state.project.layers.find(l => l.id === layerId);
        while (currentLayer?.parentId) {
          if (!expandedGroupIds.includes(currentLayer.parentId)) {
            expandedGroupIds.push(currentLayer.parentId);
          }
          currentLayer = state.project.layers.find(l => l.id === currentLayer!.parentId);
        }
      }

      return {
        project: { ...state.project, selectedLayerId: layerId, selectedLayerIds: layerId ? [layerId] : [] },
        expandedGroupIds,
      };
    }),

  toggleLayerSelection: (layerId) =>
    set((state) => {
      if (!state.project) return state;

      const currentSelection = state.project.selectedLayerIds || [];
      const isSelected = currentSelection.includes(layerId);

      const selectedLayerIds = isSelected
        ? currentSelection.filter((id) => id !== layerId)
        : [...currentSelection, layerId];

      return {
        project: {
          ...state.project,
          selectedLayerIds,
          selectedLayerId: selectedLayerIds.length === 1 ? selectedLayerIds[0] : undefined,
        },
      };
    }),

  setSelectedLayerIds: (layerIds) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            selectedLayerIds: layerIds,
            selectedLayerId: layerIds.length === 1 ? layerIds[0] : undefined,
          }
        : null,
    })),

  renameLayer: (layerId, newName) =>
    set((state) => {
      if (!state.project) return state;

      const layers = state.project.layers.map((layer) =>
        layer.id === layerId ? { ...layer, name: newName } : layer
      );

      return {
        project: { ...state.project, layers },
      };
    }),

  deleteLayer: (layerId) =>
    set((state) => {
      if (!state.project) return state;

      // Find all child layers (layers with this layer as parent)
      const childLayerIds = state.project.layers
        .filter((layer) => layer.parentId === layerId)
        .map((layer) => layer.id);

      // Collect all layer IDs to delete (parent + children)
      const layerIdsToDelete = [layerId, ...childLayerIds];

      // Remove layer and its children from layers array
      const layers = state.project.layers.filter((layer) => !layerIdsToDelete.includes(layer.id));

      // Remove all keyframes associated with deleted layers
      const keyframes = state.project.keyframes.filter(
        (kf) => !layerIdsToDelete.includes((kf as any).layerId)
      );

      // Clear selection if any deleted layer was selected
      const selectedLayerId = layerIdsToDelete.includes(state.project.selectedLayerId || '')
        ? undefined
        : state.project.selectedLayerId;

      const selectedLayerIds = (state.project.selectedLayerIds || []).filter(
        (id) => !layerIdsToDelete.includes(id)
      );

      return {
        project: { ...state.project, layers, keyframes, selectedLayerId, selectedLayerIds },
      };
    }),

  deleteLayers: (layerIds) =>
    set((state) => {
      if (!state.project) return state;

      // Collect all layers to delete including children
      const allLayerIdsToDelete = new Set<string>();

      layerIds.forEach((layerId) => {
        // Add the layer itself
        allLayerIdsToDelete.add(layerId);

        // Find and add all child layers
        const childLayerIds = state.project!.layers
          .filter((layer) => layer.parentId === layerId)
          .map((layer) => layer.id);

        childLayerIds.forEach((childId) => allLayerIdsToDelete.add(childId));
      });

      const layerIdsToDeleteArray = Array.from(allLayerIdsToDelete);

      // Remove layers
      const layers = state.project.layers.filter((layer) => !allLayerIdsToDelete.has(layer.id));

      // Remove keyframes
      const keyframes = state.project.keyframes.filter(
        (kf) => !allLayerIdsToDelete.has((kf as any).layerId)
      );

      // Clear selection if any deleted layer was selected
      const selectedLayerId = allLayerIdsToDelete.has(state.project.selectedLayerId || '')
        ? undefined
        : state.project.selectedLayerId;

      const selectedLayerIds = (state.project.selectedLayerIds || []).filter(
        (id) => !allLayerIdsToDelete.has(id)
      );

      return {
        project: { ...state.project, layers, keyframes, selectedLayerId, selectedLayerIds },
      };
    }),

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
        // Update existing keyframe - preserve layerId
        const existingKeyframe = state.project.keyframes[existingIndex];
        keyframes = state.project.keyframes.map((kf, i) =>
          i === existingIndex ? { ...newKeyframe, id: kf.id, layerId: (existingKeyframe as any).layerId } : kf
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

  // Canvas view actions
  setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.1, Math.min(5, zoom)) }),

  setCanvasPan: (pan) => set({ canvasPan: pan }),

  resetCanvasView: () => set({ canvasZoom: 1.0, canvasPan: { x: 0, y: 0 } }),

  // Timeline view actions
  setTimelineZoom: (zoom) => set({ timelineZoom: Math.max(0.5, Math.min(5, zoom)) }),

  resetTimelineView: () => set({ timelineZoom: 1.0 }),

  // Preview actions
  setPreviewMode: (mode) => set({ previewMode: mode }),

  // Group expansion actions
  toggleGroupExpanded: (groupId) =>
    set((state) => {
      const isExpanded = state.expandedGroupIds.includes(groupId);
      const expandedGroupIds = isExpanded
        ? state.expandedGroupIds.filter((id) => id !== groupId)
        : [...state.expandedGroupIds, groupId];

      return { expandedGroupIds };
    }),

  resetProject: () =>
    set({
      project: { ...defaultProject },
    }),
}));

/**
 * Auto-save to localStorage with debouncing
 */
let saveTimeout: NodeJS.Timeout | null = null;

useStore.subscribe((state) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    if (state.project) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project));
      } catch (error) {
        console.error('Failed to save project to localStorage:', error);
      }
    }
  }, 1000); // Debounce by 1 second
});
