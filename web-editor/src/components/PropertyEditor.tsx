import { useEffect, useState } from 'react';
import './PropertyEditor.css';
import { useStore } from '../store/useStore';
import { getValueAtTime, getColorAtTime } from '../engine/Interpolation';
import type { AnimatableProperty } from '../models/Keyframe';

export function PropertyEditor() {
  const project = useStore((state) => state.project);
  const addKeyframe = useStore((state) => state.addKeyframe);
  const getKeyframesForLayer = useStore((state) => state.getKeyframesForLayer);

  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [opacity, setOpacity] = useState(100); // Store as percentage 0-100
  const [fill, setFill] = useState('#ffffff');
  const [stroke, setStroke] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [selectedEasing, setSelectedEasing] = useState<string>('linear');

  const selectedLayer = project?.layers.find(
    (layer) => layer.id === project.selectedLayerId
  );

  // Update position values based on current time and keyframes
  useEffect(() => {
    if (!project?.selectedLayerId || !project) return;

    // Find the selected layer inside the effect
    const layer = project.layers.find(l => l.id === project.selectedLayerId);
    if (!layer) return;

    // Get keyframes for this layer
    const xKeyframes = getKeyframesForLayer(layer.id, 'x');
    const yKeyframes = getKeyframesForLayer(layer.id, 'y');

    // If we have keyframes, calculate interpolated values
    if (xKeyframes.length > 0) {
      const interpolatedX = getValueAtTime(xKeyframes, project.currentTime);
      setPositionX(interpolatedX);
    } else {
      setPositionX(layer.element.transform.x);
    }

    if (yKeyframes.length > 0) {
      const interpolatedY = getValueAtTime(yKeyframes, project.currentTime);
      setPositionY(interpolatedY);
    } else {
      setPositionY(layer.element.transform.y);
    }

    // Rotation
    const rotationKeyframes = getKeyframesForLayer(layer.id, 'rotation');
    if (rotationKeyframes.length > 0) {
      const interpolatedRotation = getValueAtTime(rotationKeyframes, project.currentTime);
      setRotation(interpolatedRotation);
    } else {
      setRotation(layer.element.transform.rotation);
    }

    // Scale X
    const scaleXKeyframes = getKeyframesForLayer(layer.id, 'scaleX');
    if (scaleXKeyframes.length > 0) {
      const interpolatedScaleX = getValueAtTime(scaleXKeyframes, project.currentTime);
      setScaleX(interpolatedScaleX);
    } else {
      setScaleX(layer.element.transform.scaleX);
    }

    // Scale Y
    const scaleYKeyframes = getKeyframesForLayer(layer.id, 'scaleY');
    if (scaleYKeyframes.length > 0) {
      const interpolatedScaleY = getValueAtTime(scaleYKeyframes, project.currentTime);
      setScaleY(interpolatedScaleY);
    } else {
      setScaleY(layer.element.transform.scaleY);
    }

    // Opacity (convert from 0-1 to 0-100 for display)
    const opacityKeyframes = getKeyframesForLayer(layer.id, 'opacity');
    if (opacityKeyframes.length > 0) {
      const interpolatedOpacity = getValueAtTime(opacityKeyframes, project.currentTime);
      setOpacity(Math.round(interpolatedOpacity * 100));
    } else {
      setOpacity(Math.round((layer.element.style.opacity ?? 1) * 100));
    }

    // Fill and Stroke colors (handle 'none' case)
    const fillKeyframes = getKeyframesForLayer(layer.id, 'fill');
    if (fillKeyframes.length > 0) {
      const interpolatedFill = getColorAtTime(fillKeyframes, project.currentTime);
      setFill(interpolatedFill);
    } else {
      const fillColor = layer.element.style.fill;
      // Keep 'none' as is, or use the actual fill color, or default to transparent black
      setFill(fillColor || 'none');
    }

    const strokeKeyframes = getKeyframesForLayer(layer.id, 'stroke');
    if (strokeKeyframes.length > 0) {
      const interpolatedStroke = getColorAtTime(strokeKeyframes, project.currentTime);
      setStroke(interpolatedStroke);
    } else {
      const strokeColor = layer.element.style.stroke;
      // Keep 'none' as is, or use the actual stroke color
      setStroke(strokeColor || 'none');
    }

    // Stroke Width
    const strokeWidthKeyframes = getKeyframesForLayer(layer.id, 'strokeWidth');
    if (strokeWidthKeyframes.length > 0) {
      const interpolatedStrokeWidth = getValueAtTime(strokeWidthKeyframes, project.currentTime);
      setStrokeWidth(interpolatedStrokeWidth);
    } else {
      setStrokeWidth(layer.element.style.strokeWidth ?? 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    project?.selectedLayerId,
    project?.currentTime,
    project?.keyframes?.length, // Use length instead of the array to prevent unnecessary re-renders
  ]);

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    if (!selectedLayer || !project) return;

    // Update the layer's transform
    const updatedLayers = project.layers.map((layer) => {
      if (layer.id === selectedLayer.id) {
        return {
          ...layer,
          element: {
            ...layer.element,
            transform: {
              ...layer.element.transform,
              [axis]: value,
            },
          },
        };
      }
      return layer;
    });

    useStore.setState({
      project: {
        ...project,
        layers: updatedLayers,
      },
    });

    // Update local state
    if (axis === 'x') {
      setPositionX(value);
    } else {
      setPositionY(value);
    }
  };

  const handleRotationChange = (value: number) => {
    if (!selectedLayer || !project) return;

    const updatedLayers = project.layers.map((layer) => {
      if (layer.id === selectedLayer.id) {
        return {
          ...layer,
          element: {
            ...layer.element,
            transform: {
              ...layer.element.transform,
              rotation: value,
            },
          },
        };
      }
      return layer;
    });

    useStore.setState({
      project: {
        ...project,
        layers: updatedLayers,
      },
    });

    setRotation(value);
  };

  const handleScaleChange = (axis: 'scaleX' | 'scaleY', value: number) => {
    if (!selectedLayer || !project) return;

    const updatedLayers = project.layers.map((layer) => {
      if (layer.id === selectedLayer.id) {
        return {
          ...layer,
          element: {
            ...layer.element,
            transform: {
              ...layer.element.transform,
              [axis]: value,
            },
          },
        };
      }
      return layer;
    });

    useStore.setState({
      project: {
        ...project,
        layers: updatedLayers,
      },
    });

    if (axis === 'scaleX') {
      setScaleX(value);
    } else {
      setScaleY(value);
    }
  };

  const handleOpacityChange = (percentageValue: number) => {
    if (!selectedLayer || !project) return;

    // Convert percentage (0-100) to decimal (0-1)
    const decimalValue = percentageValue / 100;

    const updatedLayers = project.layers.map((layer) => {
      if (layer.id === selectedLayer.id) {
        return {
          ...layer,
          element: {
            ...layer.element,
            style: {
              ...layer.element.style,
              opacity: decimalValue,
            },
          },
        };
      }
      return layer;
    });

    useStore.setState({
      project: {
        ...project,
        layers: updatedLayers,
      },
    });

    setOpacity(percentageValue);
  };

  const handleFillChange = (color: string) => {
    if (!selectedLayer || !project) return;

    const updatedLayers = project.layers.map((layer) => {
      if (layer.id === selectedLayer.id) {
        return {
          ...layer,
          element: {
            ...layer.element,
            style: {
              ...layer.element.style,
              fill: color,
            },
          },
        };
      }
      return layer;
    });

    useStore.setState({
      project: {
        ...project,
        layers: updatedLayers,
      },
    });

    setFill(color);
  };

  const handleStrokeChange = (color: string) => {
    if (!selectedLayer || !project) return;

    const updatedLayers = project.layers.map((layer) => {
      if (layer.id === selectedLayer.id) {
        return {
          ...layer,
          element: {
            ...layer.element,
            style: {
              ...layer.element.style,
              stroke: color,
            },
          },
        };
      }
      return layer;
    });

    useStore.setState({
      project: {
        ...project,
        layers: updatedLayers,
      },
    });

    setStroke(color);
  };

  const handleStrokeWidthChange = (width: number) => {
    if (!selectedLayer || !project) return;

    const updatedLayers = project.layers.map((layer) => {
      if (layer.id === selectedLayer.id) {
        return {
          ...layer,
          element: {
            ...layer.element,
            style: {
              ...layer.element.style,
              strokeWidth: width,
            },
          },
        };
      }
      return layer;
    });

    useStore.setState({
      project: {
        ...project,
        layers: updatedLayers,
      },
    });

    setStrokeWidth(width);
  };

  const handleAddKeyframe = (property: AnimatableProperty, value: number | string) => {
    if (!selectedLayer) return;
    addKeyframe(selectedLayer.id, property, value, selectedEasing);
  };

  const hasKeyframeAtCurrentTime = (property: AnimatableProperty): boolean => {
    if (!selectedLayer || !project) return false;

    const keyframes = getKeyframesForLayer(selectedLayer.id, property);
    return keyframes.some((kf) => kf.time === project.currentTime);
  };

  if (!project) {
    return <div className="property-editor">Loading...</div>;
  }

  if (!selectedLayer) {
    return (
      <div className="property-editor">
        <div className="property-editor-empty">No layer selected</div>
      </div>
    );
  }

  return (
    <div className="property-editor">
      <div className="property-editor-header">
        <h3>Properties</h3>
        <div className="property-editor-layer-name">{selectedLayer.name}</div>
      </div>

      <div className="property-editor-section">
        <h4>Animation</h4>
        <div className="property-row">
          <label htmlFor="easing">Easing</label>
          <select
            id="easing"
            value={selectedEasing}
            onChange={(e) => setSelectedEasing(e.target.value)}
          >
            <option value="linear">Linear</option>
            <option value="easeIn">Ease In</option>
            <option value="easeOut">Ease Out</option>
            <option value="easeInOut">Ease In-Out</option>
          </select>
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#888' }}>
            For new keyframes
          </span>
        </div>
      </div>

      <div className="property-editor-section">
        <h4>Position</h4>
        <div className="property-row">
          <label htmlFor="position-x">Position X</label>
          <input
            id="position-x"
            type="number"
            value={positionX}
            onChange={(e) => handlePositionChange('x', Number(e.target.value))}
          />
          <button
            onClick={() => handleAddKeyframe('x', positionX)}
            aria-label={`Add keyframe for x`}
            data-has-keyframe={hasKeyframeAtCurrentTime('x')}
            className={hasKeyframeAtCurrentTime('x') ? 'has-keyframe' : ''}
          >
            ◆
          </button>
        </div>

        <div className="property-row">
          <label htmlFor="position-y">Position Y</label>
          <input
            id="position-y"
            type="number"
            value={positionY}
            onChange={(e) => handlePositionChange('y', Number(e.target.value))}
          />
          <button
            onClick={() => handleAddKeyframe('y', positionY)}
            aria-label={`Add keyframe for y`}
            data-has-keyframe={hasKeyframeAtCurrentTime('y')}
            className={hasKeyframeAtCurrentTime('y') ? 'has-keyframe' : ''}
          >
            ◆
          </button>
        </div>
      </div>

      <div className="property-editor-section">
        <h4>Transform</h4>
        <div className="property-row">
          <label htmlFor="rotation">Rotation</label>
          <input
            id="rotation"
            type="number"
            value={rotation}
            onChange={(e) => handleRotationChange(Number(e.target.value))}
          />
          <button
            onClick={() => handleAddKeyframe('rotation', rotation)}
            aria-label={`Add keyframe for rotation`}
            data-has-keyframe={hasKeyframeAtCurrentTime('rotation')}
            className={hasKeyframeAtCurrentTime('rotation') ? 'has-keyframe' : ''}
          >
            ◆
          </button>
        </div>

        <div className="property-row">
          <label htmlFor="scale-x">Scale X</label>
          <input
            id="scale-x"
            type="number"
            step="0.1"
            value={scaleX}
            onChange={(e) => handleScaleChange('scaleX', Number(e.target.value))}
          />
          <button
            onClick={() => handleAddKeyframe('scaleX', scaleX)}
            aria-label={`Add keyframe for scaleX`}
            data-has-keyframe={hasKeyframeAtCurrentTime('scaleX')}
            className={hasKeyframeAtCurrentTime('scaleX') ? 'has-keyframe' : ''}
          >
            ◆
          </button>
        </div>

        <div className="property-row">
          <label htmlFor="scale-y">Scale Y</label>
          <input
            id="scale-y"
            type="number"
            step="0.1"
            value={scaleY}
            onChange={(e) => handleScaleChange('scaleY', Number(e.target.value))}
          />
          <button
            onClick={() => handleAddKeyframe('scaleY', scaleY)}
            aria-label={`Add keyframe for scaleY`}
            data-has-keyframe={hasKeyframeAtCurrentTime('scaleY')}
            className={hasKeyframeAtCurrentTime('scaleY') ? 'has-keyframe' : ''}
          >
            ◆
          </button>
        </div>
      </div>

      <div className="property-editor-section">
        <h4>Appearance</h4>
        <div className="property-row">
          <label htmlFor="fill">Fill</label>
          <input
            id="fill"
            type="color"
            value={fill === 'none' ? '#000000' : fill}
            onChange={(e) => handleFillChange(e.target.value)}
            disabled={fill === 'none'}
          />
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#888' }}>
            {fill}
          </span>
          {fill === 'none' && (
            <button
              onClick={() => handleFillChange('#000000')}
              style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px' }}
            >
              Enable
            </button>
          )}
          <button
            onClick={() => handleAddKeyframe('fill', fill)}
            aria-label={`Add keyframe for fill`}
            data-has-keyframe={hasKeyframeAtCurrentTime('fill')}
            className={hasKeyframeAtCurrentTime('fill') ? 'has-keyframe' : ''}
          >
            ◆
          </button>
        </div>

        <div className="property-row">
          <label htmlFor="stroke">Stroke</label>
          <input
            id="stroke"
            type="color"
            value={stroke === 'none' ? '#000000' : stroke}
            onChange={(e) => handleStrokeChange(e.target.value)}
            disabled={stroke === 'none'}
          />
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#888' }}>
            {stroke}
          </span>
          {stroke === 'none' && (
            <button
              onClick={() => handleStrokeChange('#000000')}
              style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px' }}
            >
              Enable
            </button>
          )}
          <button
            onClick={() => handleAddKeyframe('stroke', stroke)}
            aria-label={`Add keyframe for stroke`}
            data-has-keyframe={hasKeyframeAtCurrentTime('stroke')}
            className={hasKeyframeAtCurrentTime('stroke') ? 'has-keyframe' : ''}
          >
            ◆
          </button>
        </div>

        <div className="property-row">
          <label htmlFor="stroke-width">Stroke Width</label>
          <input
            id="stroke-width"
            type="number"
            step="0.5"
            min="0"
            value={strokeWidth}
            onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
          />
          <button
            onClick={() => handleAddKeyframe('strokeWidth', strokeWidth)}
            aria-label={`Add keyframe for strokeWidth`}
            data-has-keyframe={hasKeyframeAtCurrentTime('strokeWidth')}
            className={hasKeyframeAtCurrentTime('strokeWidth') ? 'has-keyframe' : ''}
          >
            ◆
          </button>
        </div>

        <div className="property-row">
          <label htmlFor="opacity">Opacity (%)</label>
          <input
            id="opacity"
            type="number"
            step="1"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
          />
          <button
            onClick={() => handleAddKeyframe('opacity', opacity / 100)}
            aria-label={`Add keyframe for opacity`}
            data-has-keyframe={hasKeyframeAtCurrentTime('opacity')}
            className={hasKeyframeAtCurrentTime('opacity') ? 'has-keyframe' : ''}
          >
            ◆
          </button>
        </div>
      </div>
    </div>
  );
}
