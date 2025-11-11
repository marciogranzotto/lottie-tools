import { useEffect, useRef, useState, useCallback } from 'react';
import './PreviewPanel.css';
import { useStore } from '../store/useStore';
import { LottiePreview } from '../engine/LottiePreview';
import { LottieExporter } from '../export/LottieExporter';
import { toast } from 'sonner';

export function PreviewPanel() {
  const project = useStore((state) => state.project);
  const setPreviewMode = useStore((state) => state.setPreviewMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previewEngineRef = useRef<LottiePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [renderer, setRenderer] = useState<'svg' | 'canvas' | 'html'>('svg');
  const [quality, setQuality] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);

  /**
   * Detect unsupported features and generate warnings
   */
  const detectWarnings = useCallback(() => {
    if (!project) return [];

    const warnings: string[] = [];

    // Check for high layer count
    if (project.layers.length > 50) {
      warnings.push(`High layer count (${project.layers.length}). May impact performance.`);
    }

    // Check for high keyframe count
    if (project.keyframes.length > 200) {
      warnings.push(`High keyframe count (${project.keyframes.length}). May impact performance.`);
    }

    // Check for very large dimensions
    if (project.width > 2000 || project.height > 2000) {
      warnings.push(`Large dimensions (${project.width}×${project.height}). Consider reducing for better performance.`);
    }

    // Check for high frame rate
    if (project.fps > 60) {
      warnings.push(`High frame rate (${project.fps} FPS). Standard is 30-60 FPS.`);
    }

    // Check for group layers (limited support in some players)
    const groupLayers = project.layers.filter(l => l.element.type === 'group');
    if (groupLayers.length > 0) {
      warnings.push(`${groupLayers.length} group layer(s) detected. Ensure your Lottie player supports groups.`);
    }

    return warnings;
  }, [project]);

  /**
   * Load or reload the preview
   */
  const loadPreview = useCallback(() => {
    if (!containerRef.current || !project) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Export project to Lottie JSON
      const lottieData = LottieExporter.exportToLottie(project);

      // Detect and set warnings
      const detectedWarnings = detectWarnings();
      setWarnings(detectedWarnings);

      // Initialize preview engine if needed
      if (!previewEngineRef.current) {
        previewEngineRef.current = new LottiePreview();
      }

      // Load animation
      previewEngineRef.current.load(containerRef.current, lottieData, {
        renderer,
        loop: project.loop,
        autoplay: false,
      });

      // Sync with current time
      previewEngineRef.current.goToTime(project.currentTime, project.fps, true);

      // Listen to playback events
      previewEngineRef.current.addEventListener('enterFrame', handleEnterFrame);

      setIsLoading(false);
      toast.success('Preview loaded successfully');

      // Show warnings as toasts
      detectedWarnings.forEach(warning => {
        toast.warning(warning, { duration: 5000 });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preview';
      setError(errorMessage);
      setIsLoading(false);
      toast.error(errorMessage);
      console.error('Preview load error:', err);
    }
  }, [project, renderer, detectWarnings]);

  /**
   * Handle enterFrame event from lottie-web
   */
  const handleEnterFrame = useCallback(() => {
    if (!previewEngineRef.current || !project) return;

    // Update store currentTime when animation plays
    const currentTime = previewEngineRef.current.getCurrentTime(project.fps);

    // Only update if significantly different to avoid feedback loops
    if (Math.abs(currentTime - project.currentTime) > 0.01) {
      useStore.setState((state) => ({
        project: state.project ? { ...state.project, currentTime } : null,
      }));
    }
  }, [project]);

  /**
   * Sync timeline controls with preview
   */
  useEffect(() => {
    if (!previewEngineRef.current || !previewEngineRef.current.isLoaded()) return;

    const preview = previewEngineRef.current;

    // Sync play/pause
    if (project?.isPlaying) {
      if (!preview.isPlaying()) {
        preview.play();
      }
    } else {
      if (preview.isPlaying()) {
        preview.pause();
      }
    }

    // Sync current time (only when not playing to avoid fighting)
    if (project && !project.isPlaying) {
      const previewTime = preview.getCurrentTime(project.fps);
      if (Math.abs(previewTime - project.currentTime) > 0.05) {
        preview.goToTime(project.currentTime, project.fps, true);
      }
    }

    // Sync loop
    if (project) {
      preview.setLoop(project.loop);
    }
  }, [project?.isPlaying, project?.currentTime, project?.loop, project?.fps]);

  /**
   * Auto-refresh on project changes (debounced)
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // Debounce: wait 500ms after last change
    const timeoutId = setTimeout(() => {
      if (timeSinceLastUpdate >= 500) {
        loadPreview();
        lastUpdateTimeRef.current = Date.now();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [autoRefresh, project?.layers, project?.keyframes, loadPreview]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadPreview();

    // Cleanup on unmount
    return () => {
      if (previewEngineRef.current) {
        previewEngineRef.current.destroy();
        previewEngineRef.current = null;
      }
    };
  }, []); // Only run on mount/unmount

  /**
   * Reload when renderer changes
   */
  useEffect(() => {
    if (previewEngineRef.current?.isLoaded()) {
      loadPreview();
    }
  }, [renderer, loadPreview]);

  const handleBackToEditor = () => {
    setPreviewMode('editor');
  };

  const handleRefresh = () => {
    loadPreview();
  };

  /**
   * Enter fullscreen mode
   */
  const enterFullscreen = async () => {
    if (!panelRef.current) return;

    try {
      if (panelRef.current.requestFullscreen) {
        await panelRef.current.requestFullscreen();
        setIsFullscreen(true);
        toast.success('Entered fullscreen mode (Press ESC to exit)');
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      toast.error('Failed to enter fullscreen mode');
    }
  };

  /**
   * Exit fullscreen mode
   */
  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  /**
   * Listen for fullscreen changes (ESC key)
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  /**
   * Keyboard shortcuts (F for fullscreen)
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if preview panel has focus or is in fullscreen
      if (e.key === 'f' || e.key === 'F') {
        if (document.activeElement?.closest('.preview-panel') || isFullscreen) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  if (!project) {
    return (
      <div className="preview-panel">
        <div className="preview-header">
          <h3>Lottie Preview</h3>
          <button onClick={handleBackToEditor} className="btn-back">
            ← Back to Editor
          </button>
        </div>
        <div className="preview-empty">
          <p>No project loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`preview-panel ${isFullscreen ? 'fullscreen' : ''}`} ref={panelRef}>
      {!isFullscreen && (
        <div className="preview-header">
          <h3>Lottie Preview</h3>
          <div className="preview-controls">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            <select value={renderer} onChange={(e) => setRenderer(e.target.value as any)}>
              <option value="svg">SVG</option>
              <option value="canvas">Canvas</option>
              <option value="html">HTML</option>
            </select>
            <select
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              title="Preview quality"
            >
              <option value="0.5">Low (0.5x)</option>
              <option value="1">Medium (1x)</option>
              <option value="2">High (2x)</option>
            </select>
            <button onClick={handleRefresh} disabled={isLoading} className="btn-refresh">
              {isLoading ? 'Loading...' : '↻ Refresh'}
            </button>
            <button onClick={toggleFullscreen} className="btn-fullscreen" title="Fullscreen (F)">
              ⛶ Fullscreen
            </button>
            <button onClick={handleBackToEditor} className="btn-back">
              ← Back to Editor
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="preview-error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {warnings.length > 0 && !isFullscreen && (
        <div className="preview-warnings" role="status">
          <strong>⚠️ Warnings:</strong>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="preview-container">
        <div
          ref={containerRef}
          className="preview-animation"
          style={{
            width: project.width * quality,
            height: project.height * quality,
            transform: quality !== 1 ? `scale(${1 / quality})` : undefined,
            transformOrigin: 'top left',
          }}
        />
        {isFullscreen && (
          <div className="fullscreen-hint">
            Press ESC or F to exit fullscreen
          </div>
        )}
      </div>

      {!isFullscreen && (
        <div className="preview-info">
          <span>
            {project.width}×{project.height} • {project.fps} FPS • {renderer.toUpperCase()} renderer • {quality}x quality
          </span>
          {isLoading && <span className="preview-loading">Loading...</span>}
        </div>
      )}
    </div>
  );
}
