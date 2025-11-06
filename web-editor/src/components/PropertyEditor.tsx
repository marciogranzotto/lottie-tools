import { useEffect, useState } from 'react';
import './PropertyEditor.css';
import { useStore } from '../store/useStore';
import { getValueAtTime } from '../engine/Interpolation';
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
  const [opacity, setOpacity] = useState(1);

  const selectedLayer = project?.layers.find(
    (layer) => layer.id === project.selectedLayerId
  );

  // Update position values based on current time and keyframes
  useEffect(() => {
    if (!selectedLayer || !project) return;

    // Get keyframes for this layer
    const xKeyframes = getKeyframesForLayer(selectedLayer.id, 'x');
    const yKeyframes = getKeyframesForLayer(selectedLayer.id, 'y');

    // If we have keyframes, calculate interpolated values
    if (xKeyframes.length > 0) {
      const interpolatedX = getValueAtTime(xKeyframes, project.currentTime);
      setPositionX(interpolatedX);
    } else {
      setPositionX(selectedLayer.element.transform.x);
    }

    if (yKeyframes.length > 0) {
      const interpolatedY = getValueAtTime(yKeyframes, project.currentTime);
      setPositionY(interpolatedY);
    } else {
      setPositionY(selectedLayer.element.transform.y);
    }

    // Rotation
    const rotationKeyframes = getKeyframesForLayer(selectedLayer.id, 'rotation');
    if (rotationKeyframes.length > 0) {
      const interpolatedRotation = getValueAtTime(rotationKeyframes, project.currentTime);
      setRotation(interpolatedRotation);
    } else {
      setRotation(selectedLayer.element.transform.rotation);
    }

    // Scale X
    const scaleXKeyframes = getKeyframesForLayer(selectedLayer.id, 'scaleX');
    if (scaleXKeyframes.length > 0) {
      const interpolatedScaleX = getValueAtTime(scaleXKeyframes, project.currentTime);
      setScaleX(interpolatedScaleX);
    } else {
      setScaleX(selectedLayer.element.transform.scaleX);
    }

    // Scale Y
    const scaleYKeyframes = getKeyframesForLayer(selectedLayer.id, 'scaleY');
    if (scaleYKeyframes.length > 0) {
      const interpolatedScaleY = getValueAtTime(scaleYKeyframes, project.currentTime);
      setScaleY(interpolatedScaleY);
    } else {
      setScaleY(selectedLayer.element.transform.scaleY);
    }

    // Opacity
    const opacityKeyframes = getKeyframesForLayer(selectedLayer.id, 'opacity');
    if (opacityKeyframes.length > 0) {
      const interpolatedOpacity = getValueAtTime(opacityKeyframes, project.currentTime);
      setOpacity(interpolatedOpacity);
    } else {
      setOpacity(selectedLayer.element.style.opacity ?? 1);
    }
  }, [
    selectedLayer,
    project?.currentTime,
    project?.keyframes,
    getKeyframesForLayer,
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

  const handleOpacityChange = (value: number) => {
    if (!selectedLayer || !project) return;

    const updatedLayers = project.layers.map((layer) => {
      if (layer.id === selectedLayer.id) {
        return {
          ...layer,
          element: {
            ...layer.element,
            style: {
              ...layer.element.style,
              opacity: value,
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

    setOpacity(value);
  };

  const handleAddKeyframe = (property: AnimatableProperty, value: number) => {
    if (!selectedLayer) return;
    addKeyframe(selectedLayer.id, property, value);
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
          <label htmlFor="opacity">Opacity</label>
          <input
            id="opacity"
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={opacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
          />
          <button
            onClick={() => handleAddKeyframe('opacity', opacity)}
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
