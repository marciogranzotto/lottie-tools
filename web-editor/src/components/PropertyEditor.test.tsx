import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertyEditor } from './PropertyEditor';
import { useStore } from '../store/useStore';
import type { Layer } from '../models/Layer';
import type { RectElement } from '../models/Element';

describe('PropertyEditor', () => {
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
        keyframes: [],
      },
    });
  });

  it('should render property editor when layer is selected', () => {
    render(<PropertyEditor />);
    expect(screen.getByText(/properties/i)).toBeInTheDocument();
  });

  it('should display layer name', () => {
    render(<PropertyEditor />);
    expect(screen.getByText('Test Layer')).toBeInTheDocument();
  });

  it('should display position properties', () => {
    render(<PropertyEditor />);
    expect(screen.getByLabelText(/position x/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/position y/i)).toBeInTheDocument();
  });

  it('should show current position values', () => {
    render(<PropertyEditor />);
    const xInput = screen.getByLabelText(/position x/i) as HTMLInputElement;
    const yInput = screen.getByLabelText(/position y/i) as HTMLInputElement;

    expect(xInput.value).toBe('100');
    expect(yInput.value).toBe('200');
  });

  it('should show project settings when no layer is selected', () => {
    useStore.setState({
      project: {
        name: 'Test',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        loop: true,
        currentTime: 0,
        isPlaying: false,
        layers: [mockLayer],
        selectedLayerId: undefined,
        keyframes: [],
      },
    });

    render(<PropertyEditor />);
    expect(screen.getByText(/project settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fps/i)).toBeInTheDocument();
  });

  it('should have keyframe button for each property', () => {
    render(<PropertyEditor />);
    const keyframeButtons = screen.getAllByRole('button', { name: /add keyframe/i });
    expect(keyframeButtons.length).toBeGreaterThanOrEqual(2); // At least for x and y
  });

  it('should add keyframe when keyframe button is clicked', async () => {
    const user = userEvent.setup();
    render(<PropertyEditor />);

    const buttons = screen.getAllByRole('button', { name: /add keyframe.*x/i });
    await user.click(buttons[0]);

    const state = useStore.getState();
    expect(state.project?.keyframes.length).toBe(1);
    expect(state.project?.keyframes[0].property).toBe('x');
    expect(state.project?.keyframes[0].value).toBe(100);
  });

  it('should update position when input value changes', async () => {
    const user = userEvent.setup();
    render(<PropertyEditor />);

    const xInput = screen.getByLabelText(/position x/i);
    await user.clear(xInput);
    await user.type(xInput, '250');

    // Value should be updated in the element transform
    const state = useStore.getState();
    const layer = state.project?.layers.find(l => l.id === 'layer-1');
    expect(layer?.element.transform.x).toBe(250);
  });

  it('should show keyframe indicator when keyframe exists at current time', () => {
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
            time: 1,
            property: 'x',
            value: 100,
            easing: 'linear',
            layerId: 'layer-1',
          } as any,
        ],
      },
    });

    render(<PropertyEditor />);
    // Should show some indicator that a keyframe exists (e.g., different button style)
    const buttons = screen.getAllByRole('button', { name: /keyframe.*x/i });
    expect(buttons[0]).toHaveAttribute('data-has-keyframe', 'true');
  });

  it('should display interpolated values at non-keyframe times', () => {
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

    render(<PropertyEditor />);
    const xInput = screen.getByLabelText(/position x/i) as HTMLInputElement;
    // At time=1, halfway between 0 and 2, x should be 100
    expect(Number(xInput.value)).toBeCloseTo(100, 0);
  });

  describe('Transform Properties', () => {
    it('should display rotation property', () => {
      render(<PropertyEditor />);
      expect(screen.getByRole('spinbutton', { name: /rotation/i })).toBeInTheDocument();
    });

    it('should show current rotation value', () => {
      render(<PropertyEditor />);
      const rotationInput = screen.getByRole('spinbutton', { name: /rotation/i }) as HTMLInputElement;
      expect(rotationInput.value).toBe('0');
    });

    it('should update rotation when input changes', async () => {
      const user = userEvent.setup();
      render(<PropertyEditor />);

      const rotationInput = screen.getByRole('spinbutton', { name: /rotation/i });
      await user.clear(rotationInput);
      await user.type(rotationInput, '45');

      const state = useStore.getState();
      const layer = state.project?.layers.find(l => l.id === 'layer-1');
      expect(layer?.element.transform.rotation).toBe(45);
    });

    it('should add keyframe for rotation', async () => {
      const user = userEvent.setup();
      render(<PropertyEditor />);

      const buttons = screen.getAllByRole('button', { name: /add keyframe.*rotation/i });
      await user.click(buttons[0]);

      const state = useStore.getState();
      expect(state.project?.keyframes.length).toBe(1);
      expect(state.project?.keyframes[0].property).toBe('rotation');
    });

    it('should display scale properties', () => {
      render(<PropertyEditor />);
      expect(screen.getByLabelText(/scale x/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/scale y/i)).toBeInTheDocument();
    });

    it('should show current scale values', () => {
      render(<PropertyEditor />);
      const scaleXInput = screen.getByLabelText(/scale x/i) as HTMLInputElement;
      const scaleYInput = screen.getByLabelText(/scale y/i) as HTMLInputElement;

      expect(scaleXInput.value).toBe('1');
      expect(scaleYInput.value).toBe('1');
    });

    it('should update scale when inputs change', async () => {
      const user = userEvent.setup();
      render(<PropertyEditor />);

      const scaleXInput = screen.getByLabelText(/scale x/i);
      await user.clear(scaleXInput);
      await user.type(scaleXInput, '2');

      const state = useStore.getState();
      const layer = state.project?.layers.find(l => l.id === 'layer-1');
      expect(layer?.element.transform.scaleX).toBe(2);
    });

    it('should animate rotation with interpolation', () => {
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
              property: 'rotation',
              value: 0,
              easing: 'linear',
              layerId: 'layer-1',
            } as any,
            {
              id: 'kf-2',
              time: 2,
              property: 'rotation',
              value: 180,
              easing: 'linear',
              layerId: 'layer-1',
            } as any,
          ],
        },
      });

      render(<PropertyEditor />);
      const rotationInput = screen.getByRole('spinbutton', { name: /rotation/i }) as HTMLInputElement;
      // At time=1, halfway between 0 and 2, rotation should be 90
      expect(Number(rotationInput.value)).toBeCloseTo(90, 0);
    });
  });

  describe('Opacity Property', () => {
    it('should display opacity property', () => {
      render(<PropertyEditor />);
      expect(screen.getByRole('spinbutton', { name: /opacity/i })).toBeInTheDocument();
    });

    it('should show current opacity value', () => {
      render(<PropertyEditor />);
      const opacityInput = screen.getByRole('spinbutton', { name: /opacity/i }) as HTMLInputElement;
      expect(opacityInput.value).toBe('100');
    });

    it('should update opacity when input changes', async () => {
      const user = userEvent.setup();
      render(<PropertyEditor />);

      const opacityInput = screen.getByRole('spinbutton', { name: /opacity/i });
      await user.clear(opacityInput);
      await user.type(opacityInput, '50');

      const state = useStore.getState();
      const layer = state.project?.layers.find(l => l.id === 'layer-1');
      expect(layer?.element.style.opacity).toBe(0.5);
    });

    it('should add keyframe for opacity', async () => {
      const user = userEvent.setup();
      render(<PropertyEditor />);

      const buttons = screen.getAllByRole('button', { name: /add keyframe.*opacity/i });
      await user.click(buttons[0]);

      const state = useStore.getState();
      const opacityKeyframes = state.project?.keyframes.filter(kf => kf.property === 'opacity');
      expect(opacityKeyframes?.length).toBe(1);
    });

    it('should animate opacity with interpolation', () => {
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
              property: 'opacity',
              value: 1,
              easing: 'linear',
              layerId: 'layer-1',
            } as any,
            {
              id: 'kf-2',
              time: 2,
              property: 'opacity',
              value: 0,
              easing: 'linear',
              layerId: 'layer-1',
            } as any,
          ],
        },
      });

      render(<PropertyEditor />);
      const opacityInput = screen.getByRole('spinbutton', { name: /opacity/i }) as HTMLInputElement;
      // At time=1, halfway between 0 and 2, opacity should be 50% (0.5 in decimal)
      expect(Number(opacityInput.value)).toBeCloseTo(50, 0);
    });
  });

  describe('Color Properties', () => {
    it('should display fill color picker', () => {
      render(<PropertyEditor />);
      const fillPicker = screen.getByRole('button', { name: /fill color picker/i });
      expect(fillPicker).toBeInTheDocument();
      expect(screen.getByText('#ff0000')).toBeInTheDocument();
    });

    it('should display stroke color picker', () => {
      render(<PropertyEditor />);
      const strokePicker = screen.getByRole('button', { name: /stroke color picker/i });
      expect(strokePicker).toBeInTheDocument();
      // mockLayer has no stroke set, so it defaults to 'none'
      expect(screen.getByText('none')).toBeInTheDocument();
    });

    it('should show current fill color', () => {
      render(<PropertyEditor />);
      const fillPicker = screen.getByRole('button', { name: /fill color picker/i });
      expect(fillPicker).toBeInTheDocument();
      expect(screen.getByText('#ff0000')).toBeInTheDocument();
    });

    it('should update fill color when changed', async () => {
      const user = userEvent.setup();
      render(<PropertyEditor />);

      // Click to open the color picker dropdown
      const fillPicker = screen.getByRole('button', { name: /fill color picker/i });
      await user.click(fillPicker);

      // Find the color input inside the dropdown
      const colorInput = screen.getByDisplayValue('#ff0000') as HTMLInputElement;
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });

      const state = useStore.getState();
      const layer = state.project?.layers.find(l => l.id === 'layer-1');
      expect(layer?.element.style.fill).toBe('#00ff00');
    });

    it('should add keyframe for fill color', async () => {
      const user = userEvent.setup();
      render(<PropertyEditor />);

      const buttons = screen.getAllByRole('button', { name: /add keyframe.*fill/i });
      await user.click(buttons[0]);

      const state = useStore.getState();
      const fillKeyframes = state.project?.keyframes.filter(kf => kf.property === 'fill');
      expect(fillKeyframes?.length).toBe(1);
      expect(fillKeyframes?.[0].value).toBe('#ff0000');
    });

    it('should handle fill="none" with color picker', () => {
      const layerWithNoFill = {
        ...mockLayer,
        element: {
          ...mockLayer.element,
          style: {
            ...mockLayer.element.style,
            fill: 'none',
          },
        },
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
          layers: [layerWithNoFill],
          selectedLayerId: 'layer-1',
          keyframes: [],
        },
      });

      render(<PropertyEditor />);
      // When fill is 'none', the color picker shows 'none'
      const fillPicker = screen.getByRole('button', { name: /fill color picker/i });
      expect(fillPicker).toBeInTheDocument();
      expect(fillPicker).toHaveTextContent('none');
    });

    it('should enable fill when changing color from dropdown', async () => {
      const user = userEvent.setup();
      const layerWithNoFill = {
        ...mockLayer,
        element: {
          ...mockLayer.element,
          style: {
            ...mockLayer.element.style,
            fill: 'none',
          },
        },
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
          layers: [layerWithNoFill],
          selectedLayerId: 'layer-1',
          keyframes: [],
        },
      });

      render(<PropertyEditor />);
      const fillPicker = screen.getByRole('button', { name: /fill color picker/i });
      await user.click(fillPicker);

      // Change color in the dropdown
      const colorInput = screen.getByDisplayValue('#000000') as HTMLInputElement;
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      const state = useStore.getState();
      const layer = state.project?.layers.find(l => l.id === 'layer-1');
      expect(layer?.element.style.fill).toBe('#ff0000');
    });

    it('should animate fill color with interpolation', async () => {
      const user = userEvent.setup();
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
              property: 'fill',
              value: '#ff0000',
              easing: 'linear',
              layerId: 'layer-1',
            } as any,
            {
              id: 'kf-2',
              time: 2,
              property: 'fill',
              value: '#0000ff',
              easing: 'linear',
              layerId: 'layer-1',
            } as any,
          ],
        },
      });

      render(<PropertyEditor />);
      // At time=1, halfway between red (#ff0000) and blue (#0000ff), should be purple (#800080)
      // Open the color picker to access the color input
      const fillPicker = screen.getByRole('button', { name: /fill color picker/i });
      await user.click(fillPicker);

      const colorInput = screen.getByDisplayValue('#800080') as HTMLInputElement;
      expect(colorInput.value).toBe('#800080');
    });

    it('should update stroke color when changed', async () => {
      const user = userEvent.setup();
      // Update mockLayer to have a stroke color
      const layerWithStroke = {
        ...mockLayer,
        element: {
          ...mockLayer.element,
          style: {
            ...mockLayer.element.style,
            stroke: '#0000ff',
          },
        },
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
          selectedLayerId: 'layer-1',
          keyframes: [],
        },
      });

      render(<PropertyEditor />);

      // Open the stroke color picker
      const strokePicker = screen.getByRole('button', { name: /stroke color picker/i });
      await user.click(strokePicker);

      // Find the color input in the dropdown
      const colorInput = screen.getByDisplayValue('#0000ff') as HTMLInputElement;
      fireEvent.change(colorInput, { target: { value: '#ff00ff' } });

      const state = useStore.getState();
      const layer = state.project?.layers.find(l => l.id === 'layer-1');
      expect(layer?.element.style.stroke).toBe('#ff00ff');
    });

    it('should enable stroke when changing color from dropdown', async () => {
      const user = userEvent.setup();
      const layerWithNoStroke = {
        ...mockLayer,
        element: {
          ...mockLayer.element,
          style: {
            ...mockLayer.element.style,
            stroke: 'none',
          },
        },
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
          layers: [layerWithNoStroke],
          selectedLayerId: 'layer-1',
          keyframes: [],
        },
      });

      render(<PropertyEditor />);

      // Open the stroke color picker
      const strokePicker = screen.getByRole('button', { name: /stroke color picker/i });
      await user.click(strokePicker);

      // Change color in the dropdown
      const colorInput = screen.getByDisplayValue('#000000') as HTMLInputElement;
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      const state = useStore.getState();
      const layer = state.project?.layers.find(l => l.id === 'layer-1');
      expect(layer?.element.style.stroke).toBe('#ff0000');
    });

    it('should add keyframe for stroke color', async () => {
      const user = userEvent.setup();
      const layerWithStroke = {
        ...mockLayer,
        element: {
          ...mockLayer.element,
          style: {
            ...mockLayer.element.style,
            stroke: '#00ff00',
          },
        },
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
          selectedLayerId: 'layer-1',
          keyframes: [],
        },
      });

      render(<PropertyEditor />);

      const buttons = screen.getAllByRole('button', { name: /add keyframe.*stroke/i });
      await user.click(buttons[0]);

      const state = useStore.getState();
      const strokeKeyframes = state.project?.keyframes.filter(kf => kf.property === 'stroke');
      expect(strokeKeyframes?.length).toBe(1);
      expect(strokeKeyframes?.[0].value).toBe('#00ff00');
    });
  });
});
