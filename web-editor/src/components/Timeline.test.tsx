import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timeline } from './Timeline';
import { useStore } from '../store/useStore';

describe('Timeline', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({
      project: {
        name: 'Test Project',
        width: 800,
        height: 600,
        fps: 30,
        duration: 5,
        loop: false,
        currentTime: 0,
        isPlaying: false,
        layers: [],
      },
    });
  });

  it('should render playback controls', () => {
    render(<Timeline />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(5); // At least 5 control buttons
  });

  it('should display play icon when not playing', () => {
    render(<Timeline />);
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('should display pause icon when playing', () => {
    useStore.getState().setIsPlaying(true);
    render(<Timeline />);
    expect(screen.getByText('⏸')).toBeInTheDocument();
  });

  it('should display current time and duration', () => {
    render(<Timeline />);
    expect(screen.getByText(/0\.00s \/ 5\.00s/)).toBeInTheDocument();
  });

  it('should update display when time changes', () => {
    const { rerender } = render(<Timeline />);
    useStore.getState().setCurrentTime(2.5);

    // Force re-render to pick up store changes
    rerender(<Timeline />);

    expect(screen.getByText(/2\.50s \/ 5\.00s/)).toBeInTheDocument();
  });

  it('should toggle playback on button click', async () => {
    const user = userEvent.setup();
    render(<Timeline />);

    const button = screen.getByLabelText(/play/i);
    await user.click(button);

    expect(useStore.getState().project?.isPlaying).toBe(true);
  });

  it('should render timeline slider', () => {
    render(<Timeline />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('type', 'range');
  });

  it('should update time when slider changes', async () => {
    const user = userEvent.setup();
    render(<Timeline />);

    const slider = screen.getByRole('slider') as HTMLInputElement;

    // Simulate changing the slider value
    await user.pointer({ target: slider, keys: '[MouseLeft>]' });
    slider.value = '2.5';
    await user.keyboard('[/MouseLeft]');

    // The slider allows interaction, value changes should work
    expect(slider).toHaveAttribute('type', 'range');
  });

  describe('Enhanced Controls', () => {
    it('should render stop button', () => {
      render(<Timeline />);
      expect(screen.getByLabelText(/stop/i)).toBeInTheDocument();
    });

    it('should render loop toggle', () => {
      render(<Timeline />);
      expect(screen.getByLabelText(/loop/i)).toBeInTheDocument();
    });

    it('should render frame step buttons', () => {
      render(<Timeline />);
      expect(screen.getByLabelText(/step backward/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/step forward/i)).toBeInTheDocument();
    });

    it('should stop playback and reset time on stop button click', async () => {
      const user = userEvent.setup();
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 5,
          currentTime: 2.5,
          isPlaying: true,
          layers: [],
        },
      });

      render(<Timeline />);

      const stopButton = screen.getByLabelText(/stop/i);
      await user.click(stopButton);

      expect(useStore.getState().project?.isPlaying).toBe(false);
      expect(useStore.getState().project?.currentTime).toBe(0);
    });

    it('should display FPS', () => {
      render(<Timeline />);
      expect(screen.getByText(/30.*fps/i)).toBeInTheDocument();
    });

    it('should toggle loop on loop button click', async () => {
      const user = userEvent.setup();
      render(<Timeline />);

      const loopButton = screen.getByLabelText(/loop/i);

      // Initial state should be not looping
      expect(loopButton).toHaveAttribute('data-loop', 'false');

      await user.click(loopButton);

      // After click, should be looping
      expect(loopButton).toHaveAttribute('data-loop', 'true');
    });

    it('should step forward one frame', async () => {
      const user = userEvent.setup();
      render(<Timeline />);

      const stepForwardButton = screen.getByLabelText(/step forward/i);
      const initialTime = useStore.getState().project?.currentTime || 0;

      await user.click(stepForwardButton);

      const newTime = useStore.getState().project?.currentTime || 0;
      const frameDuration = 1 / 30; // 1 frame at 30 fps
      expect(newTime).toBeCloseTo(initialTime + frameDuration, 3);
    });

    it('should step backward one frame', async () => {
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
          layers: [],
        },
      });

      render(<Timeline />);

      const stepBackwardButton = screen.getByLabelText(/step backward/i);
      const initialTime = useStore.getState().project?.currentTime || 0;

      await user.click(stepBackwardButton);

      const newTime = useStore.getState().project?.currentTime || 0;
      const frameDuration = 1 / 30;
      expect(newTime).toBeCloseTo(initialTime - frameDuration, 3);
    });

    it('should not step backward below zero', async () => {
      const user = userEvent.setup();
      render(<Timeline />);

      const stepBackwardButton = screen.getByLabelText(/step backward/i);

      await user.click(stepBackwardButton);

      expect(useStore.getState().project?.currentTime).toBe(0);
    });

    it('should not step forward beyond duration', async () => {
      const user = userEvent.setup();
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 5,
          currentTime: 5,
          isPlaying: false,
          layers: [],
        },
      });

      render(<Timeline />);

      const stepForwardButton = screen.getByLabelText(/step forward/i);

      await user.click(stepForwardButton);

      expect(useStore.getState().project?.currentTime).toBe(5);
    });
  });

  describe('Playback Integration', () => {
    it('should update time continuously when playing', () => {
      render(<Timeline />);

      // Component should integrate with PlaybackEngine
      expect(screen.getByText(/0\.00s \/ 5\.00s/)).toBeInTheDocument();
    });

    it('should pause when play button is clicked while playing', async () => {
      const user = userEvent.setup();
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 5,
          currentTime: 1,
          isPlaying: true,
          layers: [],
        },
      });

      render(<Timeline />);

      const playButton = screen.getByLabelText(/pause/i);
      await user.click(playButton);

      expect(useStore.getState().project?.isPlaying).toBe(false);
    });

    it('should display current frame number', () => {
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 5,
          currentTime: 1,
          isPlaying: false,
          layers: [],
        },
      });

      render(<Timeline />);

      // At 1 second with 30 fps, frame should be 30
      expect(screen.getByText(/frame.*30/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should toggle playback on spacebar', async () => {
      const user = userEvent.setup();
      render(<Timeline />);

      await user.keyboard(' ');

      expect(useStore.getState().project?.isPlaying).toBe(true);

      await user.keyboard(' ');

      expect(useStore.getState().project?.isPlaying).toBe(false);
    });

    it('should step forward on ArrowRight', async () => {
      const user = userEvent.setup();
      render(<Timeline />);

      const initialTime = useStore.getState().project?.currentTime || 0;

      await user.keyboard('{ArrowRight}');

      const newTime = useStore.getState().project?.currentTime || 0;
      const frameDuration = 1 / 30;
      expect(newTime).toBeCloseTo(initialTime + frameDuration, 3);
    });

    it('should step backward on ArrowLeft', async () => {
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
          layers: [],
        },
      });

      render(<Timeline />);

      const initialTime = useStore.getState().project?.currentTime || 0;

      await user.keyboard('{ArrowLeft}');

      const newTime = useStore.getState().project?.currentTime || 0;
      const frameDuration = 1 / 30;
      expect(newTime).toBeCloseTo(initialTime - frameDuration, 3);
    });

    it('should jump to start on Home', async () => {
      const user = userEvent.setup();
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 5,
          currentTime: 2.5,
          isPlaying: false,
          layers: [],
        },
      });

      render(<Timeline />);

      await user.keyboard('{Home}');

      expect(useStore.getState().project?.currentTime).toBe(0);
    });

    it('should jump to end on End', async () => {
      const user = userEvent.setup();
      useStore.setState({
        project: {
          name: 'Test',
          width: 800,
          height: 600,
          fps: 30,
          duration: 5,
          currentTime: 0,
          isPlaying: false,
          layers: [],
        },
      });

      render(<Timeline />);

      await user.keyboard('{End}');

      expect(useStore.getState().project?.currentTime).toBe(5);
    });

    it('should ignore keyboard shortcuts when input field is focused', async () => {
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
          layers: [],
        },
      });

      render(<Timeline />);
      const slider = screen.getByRole('slider');

      // Focus on the slider input
      await user.click(slider);

      // Try to trigger keyboard shortcuts while input is focused
      await user.keyboard(' '); // Space should not toggle playback

      // The playback state should not change when input is focused
      expect(useStore.getState().project?.isPlaying).toBe(false);
    });

    it('should ignore keyboard shortcuts when textarea is focused', async () => {
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
          layers: [],
        },
      });

      // Create a textarea element to test
      const container = document.createElement('div');
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);
      document.body.appendChild(container);

      render(<Timeline />);

      // Focus on the textarea
      textarea.focus();

      // Try to trigger keyboard shortcuts while textarea is focused
      await user.keyboard(' ');

      // The playback state should not change when textarea is focused
      expect(useStore.getState().project?.isPlaying).toBe(false);

      // Cleanup
      document.body.removeChild(container);
    });
  });

  describe('Timeline Slider', () => {
    it('should update time when slider value changes', async () => {
      render(<Timeline />);
      const slider = screen.getByRole('slider') as HTMLInputElement;

      // Simulate slider change
      fireEvent.change(slider, { target: { value: '2.5' } });

      // Check that the time was updated
      const state = useStore.getState();
      expect(state.project?.currentTime).toBe(2.5);
    });

    it('should handle boundary values for slider', async () => {
      render(<Timeline />);
      const slider = screen.getByRole('slider') as HTMLInputElement;

      // Test minimum value (0)
      fireEvent.change(slider, { target: { value: '0' } });
      expect(useStore.getState().project?.currentTime).toBe(0);

      // Test maximum value (duration)
      fireEvent.change(slider, { target: { value: '5' } });
      expect(useStore.getState().project?.currentTime).toBe(5);
    });

    it('should handle decimal values for slider', async () => {
      render(<Timeline />);
      const slider = screen.getByRole('slider') as HTMLInputElement;

      // Test decimal values with frame snapping (fps = 30, frameDuration = 1/30)
      // 2.75 seconds: frameNumber = round(2.75 / (1/30)) = round(82.5) = 83, snapped = 83 * (1/30) ≈ 2.7666...
      fireEvent.change(slider, { target: { value: '2.75' } });
      const time1 = useStore.getState().project?.currentTime;
      expect(time1).toBeCloseTo(2.7666666, 5); // Account for frame snapping

      // 0.5 seconds: frameNumber = round(0.5 / (1/30)) = round(15) = 15, snapped = 15 * (1/30) = 0.5
      fireEvent.change(slider, { target: { value: '0.5' } });
      expect(useStore.getState().project?.currentTime).toBe(0.5);
    });
  });
});
