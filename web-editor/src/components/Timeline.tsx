import { useEffect, useRef, useState } from 'react';
import './Timeline.css';
import { useStore } from '../store/useStore';
import { PlaybackEngine } from '../engine/PlaybackEngine';
import type { AnimatableProperty } from '../models/Keyframe';

export function Timeline() {
  const project = useStore((state) => state.project);
  const setCurrentTime = useStore((state) => state.setCurrentTime);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const getKeyframesForLayer = useStore((state) => state.getKeyframesForLayer);
  const addKeyframe = useStore((state) => state.addKeyframe);
  const deleteKeyframe = useStore((state) => state.deleteKeyframe);
  const updateKeyframe = useStore((state) => state.updateKeyframe);

  const [loop, setLoop] = useState(false);
  const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ keyframeId: string; x: number; y: number } | null>(null);
  const engineRef = useRef<PlaybackEngine | null>(null);
  const tracksRef = useRef<HTMLDivElement>(null);

  // Initialize PlaybackEngine
  useEffect(() => {
    if (!project) return;

    const engine = new PlaybackEngine({
      fps: project.fps,
      duration: project.duration,
      loop,
      onUpdate: (time) => {
        setCurrentTime(time);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, [project?.fps, project?.duration, loop, setCurrentTime]);

  // Sync playback state with engine
  useEffect(() => {
    if (!engineRef.current || !project) return;

    if (project.isPlaying) {
      engineRef.current.play();
    } else {
      engineRef.current.pause();
    }
  }, [project?.isPlaying]);

  // Sync time when manually changed (e.g., scrubbing)
  useEffect(() => {
    if (!engineRef.current || !project) return;

    const currentEngineTime = engineRef.current.getCurrentTime();
    const timeDiff = Math.abs(currentEngineTime - project.currentTime);

    // Only seek if there's a significant difference (avoid feedback loop)
    if (timeDiff > 0.01 && !project.isPlaying) {
      engineRef.current.seek(project.currentTime);
    }
  }, [project?.currentTime, project?.isPlaying]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!project) return;

    const rawTime = parseFloat(e.target.value);
    // Snap to nearest frame
    const frameDuration = 1 / project.fps;
    const frameNumber = Math.round(rawTime / frameDuration);
    const snappedTime = frameNumber * frameDuration;

    setCurrentTime(snappedTime);
    if (engineRef.current) {
      engineRef.current.seek(snappedTime);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!project?.isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (engineRef.current) {
      engineRef.current.stop();
    }
  };

  const toggleLoop = () => {
    setLoop(!loop);
    if (engineRef.current) {
      engineRef.current.setLoop(!loop);
    }
  };

  const stepForward = () => {
    if (engineRef.current && project) {
      const frameDuration = 1 / project.fps;
      const newTime = Math.min(project.currentTime + frameDuration, project.duration);
      setCurrentTime(newTime);
      engineRef.current.seek(newTime);
    }
  };

  const stepBackward = () => {
    if (engineRef.current && project) {
      const frameDuration = 1 / project.fps;
      const newTime = Math.max(project.currentTime - frameDuration, 0);
      setCurrentTime(newTime);
      engineRef.current.seek(newTime);
    }
  };

  const currentFrame = project ? Math.floor(project.currentTime * project.fps) : 0;

  // Helper: Toggle layer collapse state
  const toggleLayerCollapse = (layerId: string) => {
    setCollapsedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // Helper: Get all animated properties for a layer
  const getAnimatedProperties = (layerId: string): AnimatableProperty[] => {
    if (!project) return [];
    const keyframes = getKeyframesForLayer(layerId);
    const properties = new Set<AnimatableProperty>();
    keyframes.forEach((kf) => properties.add(kf.property));
    return Array.from(properties).sort();
  };

  // Helper: Get property display name
  const getPropertyDisplayName = (property: AnimatableProperty): string => {
    const names: Record<AnimatableProperty, string> = {
      x: 'Position X',
      y: 'Position Y',
      rotation: 'Rotation',
      scaleX: 'Scale X',
      scaleY: 'Scale Y',
      opacity: 'Opacity',
      fill: 'Fill',
      stroke: 'Stroke',
      strokeWidth: 'Stroke Width',
    };
    return names[property] || property;
  };

  // Helper: Handle track click to add keyframe
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>, layerId: string, property: AnimatableProperty) => {
    if (!project || !tracksRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const time = percentage * project.duration;

    // Get current layer
    const layer = project.layers.find((l) => l.id === layerId);
    if (!layer) return;

    // Get the current value for this property
    let value: number | string = 0;
    const transform = layer.element.transform;
    const style = layer.element.style;

    switch (property) {
      case 'x':
        value = transform.x;
        break;
      case 'y':
        value = transform.y;
        break;
      case 'rotation':
        value = transform.rotation;
        break;
      case 'scaleX':
        value = transform.scaleX;
        break;
      case 'scaleY':
        value = transform.scaleY;
        break;
      case 'opacity':
        value = style.opacity ?? 1;
        break;
      case 'fill':
        value = style.fill || '#000000';
        break;
      case 'stroke':
        value = style.stroke || '#000000';
        break;
      case 'strokeWidth':
        value = style.strokeWidth ?? 1;
        break;
    }

    // Temporarily set time to the clicked position
    const originalTime = project.currentTime;
    setCurrentTime(time);

    // Add keyframe
    addKeyframe(layerId, property, value);

    // Restore original time
    setTimeout(() => setCurrentTime(originalTime), 0);
  };

  // Helper: Handle keyframe marker click
  const handleKeyframeClick = (e: React.MouseEvent, keyframeId: string) => {
    e.stopPropagation();
    if (e.shiftKey) {
      // Delete on shift+click
      deleteKeyframe(keyframeId);
    } else {
      // Navigate to keyframe time
      const keyframe = project?.keyframes.find((kf) => kf.id === keyframeId);
      if (keyframe) {
        setCurrentTime(keyframe.time);
      }
    }
  };

  // Helper: Handle keyframe right-click for easing menu
  const handleKeyframeContextMenu = (e: React.MouseEvent, keyframeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate menu dimensions (approximate)
    const menuHeight = 220; // Approximate height of the context menu
    const menuWidth = 160;

    // Get viewport dimensions
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate position
    let x = e.clientX;
    let y = e.clientY;

    // Check if menu would overflow bottom
    if (y + menuHeight > viewportHeight) {
      y = y - menuHeight; // Position above cursor
    }

    // Check if menu would overflow right
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10; // Position from right edge
    }

    setContextMenu({
      keyframeId,
      x,
      y,
    });
  };

  // Helper: Change keyframe easing
  const handleEasingChange = (easing: string) => {
    if (contextMenu) {
      updateKeyframe(contextMenu.keyframeId, { easing });
      setContextMenu(null);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Helper: Get easing color
  const getEasingColor = (easing: string): string => {
    switch (easing) {
      case 'easeIn':
      case 'ease-in':
        return '#ff9800';
      case 'easeOut':
      case 'ease-out':
        return '#4caf50';
      case 'easeInOut':
      case 'ease-in-out':
        return '#9c27b0';
      case 'hold':
        return '#f44336';
      case 'linear':
      default:
        return '#2196f3';
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowRight':
          e.preventDefault();
          stepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepBackward();
          break;
        case 'Home':
          e.preventDefault();
          if (project) {
            setCurrentTime(0);
            if (engineRef.current) {
              engineRef.current.seek(0);
            }
          }
          break;
        case 'End':
          e.preventDefault();
          if (project) {
            setCurrentTime(project.duration);
            if (engineRef.current) {
              engineRef.current.seek(project.duration);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, togglePlayback, stepForward, stepBackward, setCurrentTime]);

  return (
    <div className="timeline">
      <div className="timeline-controls">
        <button
          onClick={stepBackward}
          aria-label="Step backward"
          title="Previous frame"
        >
          ⏮
        </button>
        <button
          onClick={togglePlayback}
          aria-label={project?.isPlaying ? 'Pause' : 'Play'}
          title={project?.isPlaying ? 'Pause' : 'Play'}
        >
          {project?.isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={handleStop}
          aria-label="Stop"
          title="Stop and reset"
        >
          ⏹
        </button>
        <button
          onClick={stepForward}
          aria-label="Step forward"
          title="Next frame"
        >
          ⏭
        </button>
        <button
          onClick={toggleLoop}
          aria-label="Loop"
          title={loop ? 'Disable loop' : 'Enable loop'}
          data-loop={loop}
          className={loop ? 'active' : ''}
        >
          🔁
        </button>
        <span className="timeline-time">
          {project?.currentTime.toFixed(2)}s / {project?.duration.toFixed(2)}s
        </span>
        <span className="timeline-frame">
          Frame {currentFrame}
        </span>
        <span className="timeline-fps">
          {project?.fps} fps
        </span>
      </div>
      <div className="timeline-scrubber">
        <input
          type="range"
          min="0"
          max={project?.duration || 5}
          step={project ? 1 / project.fps : 0.01}
          value={project?.currentTime || 0}
          onChange={handleTimeChange}
          className="timeline-slider"
        />
      </div>

      {/* Property Tracks Visualization */}
      {project && project.layers.length > 0 && (
        <div className="timeline-tracks" ref={tracksRef}>
          <div className="timeline-tracks-header">
            <span>Property Tracks</span>
            <span className="timeline-tracks-hint">
              Click track to add keyframe · Shift+Click keyframe to delete
            </span>
          </div>
          {project.layers.map((layer) => {
            const animatedProps = getAnimatedProperties(layer.id);
            const isCollapsed = collapsedLayers.has(layer.id);

            if (animatedProps.length === 0) return null;

            return (
              <div key={layer.id} className="timeline-layer-group">
                <div className="timeline-layer-header" onClick={() => toggleLayerCollapse(layer.id)}>
                  <span className="timeline-layer-collapse">
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                  <span className="timeline-layer-name">{layer.name}</span>
                  <span className="timeline-layer-props-count">
                    {animatedProps.length} {animatedProps.length === 1 ? 'property' : 'properties'}
                  </span>
                </div>

                {!isCollapsed && animatedProps.map((property) => {
                  const keyframes = getKeyframesForLayer(layer.id, property);

                  return (
                    <div key={`${layer.id}-${property}`} className="timeline-track">
                      <div className="timeline-track-label">
                        {getPropertyDisplayName(property)}
                      </div>
                      <div
                        className="timeline-track-content"
                        onClick={(e) => handleTrackClick(e, layer.id, property)}
                      >
                        {/* Time Grid */}
                        <div className="timeline-track-grid">
                          {Array.from({ length: Math.ceil(project.duration) + 1 }, (_, i) => (
                            <div
                              key={i}
                              className="timeline-track-grid-line"
                              style={{ left: `${(i / project.duration) * 100}%` }}
                            />
                          ))}
                        </div>

                        {/* Keyframe Markers */}
                        {keyframes.map((kf) => {
                          const position = (kf.time / project.duration) * 100;
                          return (
                            <div
                              key={kf.id}
                              className="timeline-keyframe"
                              style={{
                                left: `${position}%`,
                                background: getEasingColor(kf.easing),
                              }}
                              onClick={(e) => handleKeyframeClick(e, kf.id)}
                              onContextMenu={(e) => handleKeyframeContextMenu(e, kf.id)}
                              title={`Time: ${kf.time.toFixed(2)}s\nEasing: ${kf.easing}\nShift+Click to delete · Right-click for easing`}
                            />
                          );
                        })}

                        {/* Current Time Indicator */}
                        <div
                          className="timeline-track-playhead"
                          style={{ left: `${(project.currentTime / project.duration) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Easing Context Menu */}
      {contextMenu && (
        <div
          className="timeline-context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="timeline-context-menu-header">Change Easing</div>
          <button onClick={() => handleEasingChange('linear')}>
            <span className="timeline-context-menu-swatch" style={{ background: getEasingColor('linear') }} />
            Linear
          </button>
          <button onClick={() => handleEasingChange('easeIn')}>
            <span className="timeline-context-menu-swatch" style={{ background: getEasingColor('easeIn') }} />
            Ease In
          </button>
          <button onClick={() => handleEasingChange('easeOut')}>
            <span className="timeline-context-menu-swatch" style={{ background: getEasingColor('easeOut') }} />
            Ease Out
          </button>
          <button onClick={() => handleEasingChange('easeInOut')}>
            <span className="timeline-context-menu-swatch" style={{ background: getEasingColor('easeInOut') }} />
            Ease In-Out
          </button>
          <button onClick={() => handleEasingChange('hold')}>
            <span className="timeline-context-menu-swatch" style={{ background: getEasingColor('hold') }} />
            Hold
          </button>
        </div>
      )}
    </div>
  );
}
