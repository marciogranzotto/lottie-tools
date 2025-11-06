import { useStore } from '../store/useStore';
import './LayersPanel.css';

export function LayersPanel() {
  const project = useStore((state) => state.project);
  const toggleLayerVisibility = useStore((state) => state.toggleLayerVisibility);
  const toggleLayerLock = useStore((state) => state.toggleLayerLock);
  const selectLayer = useStore((state) => state.selectLayer);

  const hasLayers = project && project.layers.length > 0;

  return (
    <div className="layers-panel">
      <h2 className="panel-title">Layers</h2>
      <div className="layers-content">
        {!hasLayers ? (
          <p className="panel-empty">No layers yet. Import an SVG or Lottie file to get started.</p>
        ) : (
          <ul className="layers-list">
            {project.layers.map((layer) => (
              <li
                key={layer.id}
                className={`layer-item ${project.selectedLayerId === layer.id ? 'selected' : ''}`}
                onClick={() => selectLayer(layer.id)}
              >
                <div className="layer-info">
                  <span className="layer-name">{layer.name}</span>
                  <span className="layer-type">{layer.element.type}</span>
                </div>
                <div className="layer-controls">
                  <button
                    className="layer-control-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    aria-label="Toggle visibility"
                    data-visible={layer.visible}
                  >
                    {layer.visible ? '👁' : '👁‍🗨'}
                  </button>
                  <button
                    className="layer-control-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerLock(layer.id);
                    }}
                    aria-label="Toggle lock"
                    data-locked={layer.locked}
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
