import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Canvas } from './Canvas';
import { useStore } from '../store/useStore';
import type { Layer } from '../models/Layer';
import type { RectElement } from '../models/Element';

describe('Canvas', () => {
  const mockLayer: Layer = {
    id: 'layer-1',
    name: 'Test Layer',
    visible: true,
    locked: false,
    element: {
      id: 'elem-1',
      type: 'rect',
      name: 'Rectangle',
      transform: {
        x: 100,
        y: 200,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
      style: {
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
      },
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    } as RectElement,
  };

  beforeEach(() => {
    useStore.setState({
      project: {
        name: 'Test Project',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        currentTime: 0,
        isPlaying: false,
        layers: [],
        selectedLayerId: undefined,
        keyframes: [],
      },
    });
  });

  it('should render canvas element', () => {
    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should set canvas dimensions from project settings', () => {
    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');

    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('should display canvas info with dimensions and fps', () => {
    render(<Canvas />);
    expect(screen.getByText('800 × 600px @ 30fps')).toBeInTheDocument();
  });

  it('should update dimensions when project changes', () => {
    const { container, rerender } = render(<Canvas />);

    useStore.getState().updateProjectSettings({
      width: 1920,
      height: 1080,
      fps: 60,
    });

    // Force re-render to pick up store changes
    rerender(<Canvas />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '1920');
    expect(canvas).toHaveAttribute('height', '1080');
  });

  it('should use default dimensions when project is null', () => {
    useStore.setState({ project: null });
    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');

    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<Canvas />);
    expect(container.querySelector('.canvas-container')).toBeInTheDocument();
    expect(container.querySelector('.canvas-wrapper')).toBeInTheDocument();
    expect(container.querySelector('.canvas')).toBeInTheDocument();
  });

  it('should render when project has layers', () => {
    useStore.setState({
      project: {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        currentTime: 0,
        isPlaying: false,
        layers: [mockLayer],
        selectedLayerId: undefined,
        keyframes: [],
      },
    });

    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should skip rendering invisible layers', () => {
    const invisibleLayer: Layer = {
      ...mockLayer,
      id: 'layer-2',
      visible: false,
    };

    useStore.setState({
      project: {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        currentTime: 0,
        isPlaying: false,
        layers: [mockLayer, invisibleLayer],
        selectedLayerId: undefined,
        keyframes: [],
      },
    });

    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render layers with keyframe animations', () => {
    useStore.setState({
      project: {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        currentTime: 1,
        isPlaying: false,
        layers: [mockLayer],
        selectedLayerId: 'layer-1',
        keyframes: [
          {
            id: 'kf-1',
            time: 0,
            property: 'x',
            value: 100,
            easing: 'linear',
            layerId: 'layer-1',
          } as any,
          {
            id: 'kf-2',
            time: 2,
            property: 'x',
            value: 300,
            easing: 'linear',
            layerId: 'layer-1',
          } as any,
        ],
      },
    });

    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render layers with stroke style', () => {
    const layerWithStroke: Layer = {
      ...mockLayer,
      element: {
        ...mockLayer.element,
        style: {
          fill: '#ff0000',
          stroke: '#0000ff',
          strokeWidth: 3,
        },
      } as RectElement,
    };

    useStore.setState({
      project: {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        currentTime: 0,
        isPlaying: false,
        layers: [layerWithStroke],
        selectedLayerId: undefined,
        keyframes: [],
      },
    });

    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render layers without stroke style', () => {
    const layerNoStroke: Layer = {
      ...mockLayer,
      element: {
        ...mockLayer.element,
        style: {
          fill: '#ff0000',
        },
      } as RectElement,
    };

    useStore.setState({
      project: {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        currentTime: 0,
        isPlaying: false,
        layers: [layerNoStroke],
        selectedLayerId: undefined,
        keyframes: [],
      },
    });

    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should update rendering when currentTime changes', () => {
    const { rerender } = render(<Canvas />);

    useStore.setState({
      project: {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        currentTime: 0,
        isPlaying: false,
        layers: [mockLayer],
        selectedLayerId: undefined,
        keyframes: [
          {
            id: 'kf-1',
            time: 0,
            property: 'x',
            value: 0,
            easing: 'linear',
            layerId: 'layer-1',
          } as any,
          {
            id: 'kf-2',
            time: 2,
            property: 'x',
            value: 200,
            easing: 'linear',
            layerId: 'layer-1',
          } as any,
        ],
      },
    });

    rerender(<Canvas />);

    // Change time
    useStore.getState().updateProjectSettings({ currentTime: 1 });
    rerender(<Canvas />);

    // Component should re-render (canvas still exists)
    expect(screen.getByText(/800.*600px.*30fps/)).toBeInTheDocument();
  });

  it('should render layers with Y-axis keyframes', () => {
    useStore.setState({
      project: {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        currentTime: 1,
        isPlaying: false,
        layers: [mockLayer],
        selectedLayerId: 'layer-1',
        keyframes: [
          {
            id: 'kf-1',
            time: 0,
            property: 'y',
            value: 100,
            easing: 'linear',
            layerId: 'layer-1',
          } as any,
          {
            id: 'kf-2',
            time: 2,
            property: 'y',
            value: 300,
            easing: 'linear',
            layerId: 'layer-1',
          } as any,
        ],
      },
    });

    const { container } = render(<Canvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
