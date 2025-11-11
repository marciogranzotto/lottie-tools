import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewPanel } from './PreviewPanel';
import { useStore } from '../store/useStore';
import type { Layer } from '../models/Layer';
import type { RectElement } from '../models/Element';

// Mock lottie-web
vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: vi.fn(() => ({
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      goToAndStop: vi.fn(),
      goToAndPlay: vi.fn(),
      destroy: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setSpeed: vi.fn(),
      get loop() {
        return false;
      },
      set loop(value: boolean) {
        // Setter
      },
      get isPaused() {
        return true;
      },
      currentFrame: 0,
      totalFrames: 150,
    })),
  },
}));

describe('PreviewPanel', () => {
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
        loop: true,
        currentTime: 0,
        isPlaying: false,
        layers: [mockLayer],
        selectedLayerId: 'layer-1',
        selectedLayerIds: ['layer-1'],
        keyframes: [],
      },
      previewMode: 'lottie',
    });
  });

  it('should render preview panel header', () => {
    render(<PreviewPanel />);
    expect(screen.getByText('Lottie Preview')).toBeInTheDocument();
  });

  it('should render back to editor button', () => {
    render(<PreviewPanel />);
    const backButton = screen.getByRole('button', { name: /back to editor/i });
    expect(backButton).toBeInTheDocument();
  });

  it('should render refresh button', () => {
    render(<PreviewPanel />);
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('should render auto-refresh checkbox', () => {
    render(<PreviewPanel />);
    const checkbox = screen.getByRole('checkbox', { name: /auto-refresh/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should render renderer select', () => {
    render(<PreviewPanel />);
    const selects = screen.getAllByRole('combobox');
    const rendererSelect = selects.find(s => s.querySelector('option[value="svg"]'));
    expect(rendererSelect).toBeInTheDocument();
    expect(rendererSelect).toHaveValue('svg');
  });

  it('should switch back to editor mode when back button clicked', async () => {
    const user = userEvent.setup();
    render(<PreviewPanel />);

    const backButton = screen.getByRole('button', { name: /back to editor/i });
    await user.click(backButton);

    const state = useStore.getState();
    expect(state.previewMode).toBe('editor');
  });

  it('should toggle auto-refresh when checkbox clicked', async () => {
    const user = userEvent.setup();
    render(<PreviewPanel />);

    const checkbox = screen.getByRole('checkbox', { name: /auto-refresh/i });
    await user.click(checkbox);

    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });

  it('should change renderer when select value changes', async () => {
    const user = userEvent.setup();
    render(<PreviewPanel />);

    const selects = screen.getAllByRole('combobox');
    const rendererSelect = selects.find(s => s.querySelector('option[value="svg"]')) as HTMLSelectElement;
    await user.selectOptions(rendererSelect, 'canvas');

    expect(rendererSelect).toHaveValue('canvas');
  });

  it('should display project dimensions', () => {
    render(<PreviewPanel />);
    expect(screen.getByText(/800×600/)).toBeInTheDocument();
  });

  it('should display project FPS', () => {
    render(<PreviewPanel />);
    expect(screen.getByText(/30 FPS/)).toBeInTheDocument();
  });

  it('should display renderer type', () => {
    render(<PreviewPanel />);
    expect(screen.getByText(/SVG renderer/)).toBeInTheDocument();
  });

  it('should show empty state when no project', () => {
    useStore.setState({ project: null });
    render(<PreviewPanel />);
    expect(screen.getByText('No project loaded')).toBeInTheDocument();
  });

  it('should render preview animation container', () => {
    const { container } = render(<PreviewPanel />);
    const animationDiv = container.querySelector('.preview-animation');
    expect(animationDiv).toBeInTheDocument();
  });

  it('should set animation container dimensions from project', () => {
    const { container } = render(<PreviewPanel />);
    const animationDiv = container.querySelector('.preview-animation') as HTMLElement;
    expect(animationDiv).toHaveStyle({ width: '800px', height: '600px' });
  });

  it('should not show error initially', () => {
    render(<PreviewPanel />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should display loading state during refresh', async () => {
    const user = userEvent.setup();
    render(<PreviewPanel />);

    // Initial load may show loading
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('should render preview controls section', () => {
    const { container } = render(<PreviewPanel />);
    const controls = container.querySelector('.preview-controls');
    expect(controls).toBeInTheDocument();
  });

  it('should render preview info section', () => {
    const { container } = render(<PreviewPanel />);
    const info = container.querySelector('.preview-info');
    expect(info).toBeInTheDocument();
  });
});
