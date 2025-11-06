import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
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
    });
  });

  describe('initial state', () => {
    it('should have default project settings', () => {
      const state = useStore.getState();
      expect(state.project).toEqual({
        name: 'Untitled Project',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        currentTime: 0,
        isPlaying: false,
        layers: [],
      });
    });
  });

  describe('setProject', () => {
    it('should replace the entire project', () => {
      const newProject = {
        name: 'My Animation',
        width: 1920,
        height: 1080,
        fps: 60,
        duration: 10,
        currentTime: 2.5,
        isPlaying: true,
      };

      useStore.getState().setProject(newProject);

      expect(useStore.getState().project).toEqual(newProject);
    });
  });

  describe('updateProjectSettings', () => {
    it('should update specific project settings', () => {
      useStore.getState().updateProjectSettings({
        name: 'Updated Name',
        width: 1280,
      });

      const project = useStore.getState().project;
      expect(project?.name).toBe('Updated Name');
      expect(project?.width).toBe(1280);
      expect(project?.height).toBe(600); // unchanged
    });

    it('should handle null project gracefully', () => {
      useStore.setState({ project: null });

      useStore.getState().updateProjectSettings({ name: 'Test' });

      expect(useStore.getState().project).toBeNull();
    });
  });

  describe('setCurrentTime', () => {
    it('should update current time', () => {
      useStore.getState().setCurrentTime(2.5);

      expect(useStore.getState().project?.currentTime).toBe(2.5);
    });

    it('should handle null project gracefully', () => {
      useStore.setState({ project: null });

      useStore.getState().setCurrentTime(1.0);

      expect(useStore.getState().project).toBeNull();
    });
  });

  describe('setIsPlaying', () => {
    it('should toggle playing state to true', () => {
      useStore.getState().setIsPlaying(true);

      expect(useStore.getState().project?.isPlaying).toBe(true);
    });

    it('should toggle playing state to false', () => {
      useStore.getState().setIsPlaying(true);
      useStore.getState().setIsPlaying(false);

      expect(useStore.getState().project?.isPlaying).toBe(false);
    });

    it('should handle null project gracefully', () => {
      useStore.setState({ project: null });

      useStore.getState().setIsPlaying(true);

      expect(useStore.getState().project).toBeNull();
    });
  });

  describe('toggleLayerVisibility', () => {
    it('should toggle layer visibility from true to false', () => {
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Layer 1',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rect',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                style: {},
              },
              visible: true,
              locked: false,
            },
          ],
        },
      });

      useStore.getState().toggleLayerVisibility('layer1');

      expect(useStore.getState().project?.layers[0].visible).toBe(false);
    });

    it('should toggle layer visibility from false to true', () => {
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Layer 1',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rect',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                style: {},
              },
              visible: false,
              locked: false,
            },
          ],
        },
      });

      useStore.getState().toggleLayerVisibility('layer1');

      expect(useStore.getState().project?.layers[0].visible).toBe(true);
    });

    it('should handle null project gracefully', () => {
      useStore.setState({ project: null });

      useStore.getState().toggleLayerVisibility('layer1');

      expect(useStore.getState().project).toBeNull();
    });
  });

  describe('toggleLayerLock', () => {
    it('should toggle layer lock from false to true', () => {
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Layer 1',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rect',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                style: {},
              },
              visible: true,
              locked: false,
            },
          ],
        },
      });

      useStore.getState().toggleLayerLock('layer1');

      expect(useStore.getState().project?.layers[0].locked).toBe(true);
    });

    it('should toggle layer lock from true to false', () => {
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Layer 1',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rect',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                style: {},
              },
              visible: true,
              locked: true,
            },
          ],
        },
      });

      useStore.getState().toggleLayerLock('layer1');

      expect(useStore.getState().project?.layers[0].locked).toBe(false);
    });

    it('should handle null project gracefully', () => {
      useStore.setState({ project: null });

      useStore.getState().toggleLayerLock('layer1');

      expect(useStore.getState().project).toBeNull();
    });
  });

  describe('selectLayer', () => {
    it('should set selected layer id', () => {
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Layer 1',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rect',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                style: {},
              },
              visible: true,
              locked: false,
            },
          ],
        },
      });

      useStore.getState().selectLayer('layer1');

      expect(useStore.getState().project?.selectedLayerId).toBe('layer1');
    });

    it('should update selected layer when selecting different layer', () => {
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          selectedLayerId: 'layer1',
          layers: [
            {
              id: 'layer1',
              name: 'Layer 1',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rect',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                style: {},
              },
              visible: true,
              locked: false,
            },
            {
              id: 'layer2',
              name: 'Layer 2',
              element: {
                id: 'circle1',
                type: 'circle',
                name: 'Circle',
                cx: 50,
                cy: 50,
                r: 25,
                transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                style: {},
              },
              visible: true,
              locked: false,
            },
          ],
        },
      });

      useStore.getState().selectLayer('layer2');

      expect(useStore.getState().project?.selectedLayerId).toBe('layer2');
    });
  });
});
