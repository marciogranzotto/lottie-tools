import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayersPanel } from './LayersPanel';
import { useStore } from '../store/useStore';
import { Layer } from '../models/Layer';

describe('LayersPanel', () => {
  beforeEach(() => {
    useStore.setState({
      project: null,
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no project exists', () => {
      render(<LayersPanel />);

      expect(screen.getByText(/no layers yet/i)).toBeInTheDocument();
    });

    it('should show empty message when project has no layers', () => {
      useStore.setState({
        project: {
          name: 'Empty Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [],
        },
      });

      render(<LayersPanel />);

      expect(screen.getByText(/no layers yet/i)).toBeInTheDocument();
    });
  });

  describe('Layer Display', () => {
    it('should display layer names', () => {
      useStore.setState({
        project: {
          name: 'Test Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Rectangle Layer',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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
              name: 'Circle Layer',
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

      render(<LayersPanel />);

      expect(screen.getByText('Rectangle Layer')).toBeInTheDocument();
      expect(screen.getByText('Circle Layer')).toBeInTheDocument();
    });

    it('should display layer types', () => {
      useStore.setState({
        project: {
          name: 'Test Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'My Shape',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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

      const { container } = render(<LayersPanel />);

      const layerType = container.querySelector('.layer-type');
      expect(layerType).toHaveTextContent('rect');
    });

    it('should display multiple layers in order', () => {
      useStore.setState({
        project: {
          name: 'Test Project',
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
                id: 'el1',
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
                id: 'el2',
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
            {
              id: 'layer3',
              name: 'Layer 3',
              element: {
                id: 'el3',
                type: 'ellipse',
                name: 'Ellipse',
                cx: 100,
                cy: 100,
                rx: 50,
                ry: 25,
                transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                style: {},
              },
              visible: true,
              locked: false,
            },
          ],
        },
      });

      render(<LayersPanel />);

      const layers = screen.getAllByRole('listitem');
      expect(layers).toHaveLength(3);
      expect(layers[0]).toHaveTextContent('Layer 1');
      expect(layers[1]).toHaveTextContent('Layer 2');
      expect(layers[2]).toHaveTextContent('Layer 3');
    });
  });

  describe('Layer Visibility', () => {
    it('should show visibility icon for visible layers', () => {
      useStore.setState({
        project: {
          name: 'Test Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Visible Layer',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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

      render(<LayersPanel />);

      const visibilityButton = screen.getByRole('button', { name: /toggle visibility/i });
      expect(visibilityButton).toBeInTheDocument();
      expect(visibilityButton).toHaveAttribute('data-visible', 'true');
    });

    it('should show hidden icon for invisible layers', () => {
      useStore.setState({
        project: {
          name: 'Test Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Hidden Layer',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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

      render(<LayersPanel />);

      const visibilityButton = screen.getByRole('button', { name: /toggle visibility/i });
      expect(visibilityButton).toHaveAttribute('data-visible', 'false');
    });

    it('should toggle layer visibility when clicked', async () => {
      const user = userEvent.setup();

      useStore.setState({
        project: {
          name: 'Test Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Test Layer',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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

      render(<LayersPanel />);

      const visibilityButton = screen.getByRole('button', { name: /toggle visibility/i });
      expect(visibilityButton).toHaveAttribute('data-visible', 'true');

      await user.click(visibilityButton);

      expect(useStore.getState().project?.layers[0].visible).toBe(false);
    });
  });

  describe('Layer Locking', () => {
    it('should show lock icon for locked layers', () => {
      useStore.setState({
        project: {
          name: 'Test Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Locked Layer',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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

      render(<LayersPanel />);

      const lockButton = screen.getByRole('button', { name: /toggle lock/i });
      expect(lockButton).toHaveAttribute('data-locked', 'true');
    });

    it('should toggle layer lock when clicked', async () => {
      const user = userEvent.setup();

      useStore.setState({
        project: {
          name: 'Test Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Test Layer',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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

      render(<LayersPanel />);

      const lockButton = screen.getByRole('button', { name: /toggle lock/i });
      expect(lockButton).toHaveAttribute('data-locked', 'false');

      await user.click(lockButton);

      expect(useStore.getState().project?.layers[0].locked).toBe(true);
    });
  });

  describe('Layer Selection', () => {
    it('should highlight selected layer', () => {
      useStore.setState({
        project: {
          name: 'Test Project',
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
              name: 'Selected Layer',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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

      render(<LayersPanel />);

      const layerItem = screen.getByRole('listitem');
      expect(layerItem).toHaveClass('selected');
    });

    it('should select layer when clicked', async () => {
      const user = userEvent.setup();

      useStore.setState({
        project: {
          name: 'Test Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'Test Layer',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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

      render(<LayersPanel />);

      const layerItem = screen.getByRole('listitem');
      await user.click(layerItem);

      expect(useStore.getState().project?.selectedLayerId).toBe('layer1');
    });
  });

  describe('Dynamic Updates', () => {
    it('should update when layers are added', () => {
      const { rerender } = render(<LayersPanel />);

      expect(screen.getByText(/no layers yet/i)).toBeInTheDocument();

      useStore.setState({
        project: {
          name: 'Test Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'layer1',
              name: 'New Layer',
              element: {
                id: 'rect1',
                type: 'rect',
                name: 'Rectangle',
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

      rerender(<LayersPanel />);

      expect(screen.getByText('New Layer')).toBeInTheDocument();
      expect(screen.queryByText(/no layers yet/i)).not.toBeInTheDocument();
    });
  });
});
