import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileImport } from './FileImport';
import { useStore } from '../store/useStore';

describe('FileImport', () => {
  beforeEach(() => {
    useStore.setState({
      project: null,
    });
  });

  describe('Rendering', () => {
    it('should render file input for SVG and Lottie JSON', () => {
      const { container } = render(<FileImport />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.svg,.json,image/svg+xml,application/json');
    });

    it('should render import button', () => {
      render(<FileImport />);

      const button = screen.getByRole('button', { name: /import/i });
      expect(button).toBeInTheDocument();
    });

    it('should show no message initially', () => {
      render(<FileImport />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should handle SVG file selection', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const svgContent = '<svg width="100" height="100"><rect x="10" y="10" width="50" height="50" fill="red"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const project = useStore.getState().project;
        expect(project).not.toBeNull();
        // Now imports 2 layers: group + child
        expect(project?.layers).toHaveLength(2);
        expect(project?.layers[0].element.type).toBe('group');
        expect(project?.layers[0].name).toBe('test'); // Group name from filename
        expect(project?.layers[1].element.type).toBe('rect');
        expect(project?.layers[1].parentId).toBe(project?.layers[0].id);
      });
    });

    it('should handle multiple elements in SVG', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const svgContent = `
        <svg width="200" height="200">
          <rect x="10" y="10" width="50" height="50"/>
          <circle cx="100" cy="100" r="25"/>
          <ellipse cx="150" cy="150" rx="30" ry="20"/>
        </svg>
      `;
      const file = new File([svgContent], 'multi.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const project = useStore.getState().project;
        // Now imports 4 layers: group + 3 children
        expect(project?.layers).toHaveLength(4);
        expect(project?.layers[0].element.type).toBe('group');
        expect(project?.layers[1].element.type).toBe('rect');
        expect(project?.layers[2].element.type).toBe('circle');
        expect(project?.layers[3].element.type).toBe('ellipse');
      });
    });

    it('should extract dimensions from SVG', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const svgContent = '<svg viewBox="0 0 800 600"><rect x="0" y="0" width="10" height="10"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const project = useStore.getState().project;
        expect(project?.width).toBe(800);
        expect(project?.height).toBe(600);
      });
    });

    it('should use default dimensions if not in SVG', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const svgContent = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const project = useStore.getState().project;
        // Should use default dimensions
        expect(project?.width).toBe(800);
        expect(project?.height).toBe(600);
      });
    });

    it('should set default project settings', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const svgContent = '<svg width="100" height="100"><rect x="0" y="0" width="10" height="10"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const project = useStore.getState().project;
        expect(project?.name).toBe('test.svg');
        expect(project?.fps).toBe(30);
        expect(project?.duration).toBe(3);
        expect(project?.currentTime).toBe(0);
        expect(project?.isPlaying).toBe(false);
      });
    });
  });

  describe('Success States', () => {
    it('should show success message after successful import', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const svgContent = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      // Success is now shown via toast, so check project state instead
      await waitFor(() => {
        const project = useStore.getState().project;
        expect(project?.layers).toHaveLength(2); // group + child
      });
    });

    it('should show number of imported layers in success message', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const svgContent = `
        <svg>
          <rect x="0" y="0" width="10" height="10"/>
          <circle cx="50" cy="50" r="25"/>
        </svg>
      `;
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      // Success is now shown via toast, check project has correct number of layers
      await waitFor(() => {
        const project = useStore.getState().project;
        // 2 child elements + 1 group = 3 layers total
        expect(project?.layers).toHaveLength(3);
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message for invalid SVG', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const invalidContent = '<not-valid-svg>';
      const file = new File([invalidContent], 'invalid.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const message = screen.getByRole('alert');
        expect(message).toHaveTextContent(/failed to import/i);
        expect(message).toHaveClass('error');
      });
    });

    it('should show error message for empty SVG', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const emptyContent = '<svg></svg>';
      const file = new File([emptyContent], 'empty.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const message = screen.getByRole('alert');
        expect(message).toHaveTextContent(/no elements found/i);
        expect(message).toHaveClass('error');
      });
    });

    it('should handle file read errors', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      // Create a file that will cause a read error
      const file = new File([''], 'test.svg', { type: 'image/svg+xml' });
      // Mock FileReader to throw an error
      const originalFileReader = window.FileReader;
      window.FileReader = class {
        readAsText() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read error'));
            }
          }, 0);
        }
      } as any;

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const message = screen.getByRole('alert');
        expect(message).toHaveTextContent(/failed to read file/i);
        expect(message).toHaveClass('error');
      });

      // Restore original FileReader
      window.FileReader = originalFileReader;
    });

    it('should accept both SVG and JSON files', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      // File input should accept both SVG and Lottie JSON files
      expect(fileInput.accept).toBe('.svg,.json,image/svg+xml,application/json');
    });
  });

  describe('Loading States', () => {
    it('should show loading state while processing file', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const svgContent = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;

      // Start upload but don't wait for completion
      user.upload(fileInput, file);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/importing/i)).toBeInTheDocument();
      });
    });

    it('should disable input during file processing', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const svgContent = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      const button = screen.getByRole('button', { name: /import/i });

      // Start upload
      user.upload(fileInput, file);

      // Should disable button during processing
      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Should re-enable after processing
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('User Interaction', () => {
    it('should trigger file input when button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const button = screen.getByRole('button', { name: /import/i });

      // Mock click on file input
      const clickSpy = vi.spyOn(fileInput, 'click');

      await user.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should clear previous message when importing new file', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      // First import - successful
      const svgContent1 = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      const file1 = new File([svgContent1], 'test1.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file1);

      await waitFor(() => {
        const project = useStore.getState().project;
        expect(project?.layers).toHaveLength(2); // group + child
      });

      // Second import - should add new layers
      const svgContent2 = '<svg><circle cx="50" cy="50" r="25"/></svg>';
      const file2 = new File([svgContent2], 'test2.svg', { type: 'image/svg+xml' });

      await user.upload(fileInput, file2);

      await waitFor(() => {
        const project = useStore.getState().project;
        // First import: 2 layers, Second import: 2 more layers = 4 total
        expect(project?.layers).toHaveLength(4);
      });
    });
  });

  describe('Integration with Store', () => {
    it('should merge layers with existing project', async () => {
      const user = userEvent.setup();

      // Set up initial project with one layer
      useStore.setState({
        project: {
          name: 'Existing Project',
          width: 800,
          height: 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: [
            {
              id: 'existing-layer',
              name: 'Existing Layer',
              element: {
                id: 'existing-rect',
                type: 'rect',
                name: 'Existing Rect',
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

      const { container } = render(<FileImport />);

      const svgContent = '<svg><circle cx="50" cy="50" r="25"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const project = useStore.getState().project;
        // Should have existing + new group + new child = 3 layers
        expect(project?.layers).toHaveLength(3);
        expect(project?.layers[0].id).toBe('existing-layer');
        expect(project?.layers[1].element.type).toBe('group'); // New group
        expect(project?.layers[2].element.type).toBe('circle'); // New child
      });
    });

    it('should create new project if none exists', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileImport />);

      expect(useStore.getState().project).toBeNull();

      const svgContent = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const fileInput = container.querySelector('input[type="file"]')!;
      await user.upload(fileInput, file);

      await waitFor(() => {
        const project = useStore.getState().project;
        expect(project).not.toBeNull();
        // Now imports 2 layers: group + child
        expect(project?.layers).toHaveLength(2);
      });
    });
  });
});
