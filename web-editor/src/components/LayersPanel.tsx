import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import './LayersPanel.css';

export function LayersPanel() {
  const project = useStore((state) => state.project);
  const toggleLayerVisibility = useStore((state) => state.toggleLayerVisibility);
  const toggleLayerLock = useStore((state) => state.toggleLayerLock);
  const selectLayer = useStore((state) => state.selectLayer);
  const toggleLayerSelection = useStore((state) => state.toggleLayerSelection);
  const renameLayer = useStore((state) => state.renameLayer);
  const deleteLayer = useStore((state) => state.deleteLayer);
  const deleteLayers = useStore((state) => state.deleteLayers);
  const expandedGroupIds = useStore((state) => state.expandedGroupIds);
  const toggleGroupExpanded = useStore((state) => state.toggleGroupExpanded);

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [layersToDelete, setLayersToDelete] = useState<string[] | null>(null);
  const layerRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const hasLayers = project && project.layers.length > 0;

  // Helper function to check if a layer has children
  const hasChildren = (layerId: string): boolean => {
    return project?.layers.some((layer) => layer.parentId === layerId) || false;
  };

  // Helper function to check if a layer should be visible based on parent expansion state
  const isLayerVisible = (layer: { id: string; parentId?: string }): boolean => {
    if (!layer.parentId) {
      // Top-level layers are always visible
      return true;
    }
    // Child layers are only visible if their parent is expanded
    return expandedGroupIds.includes(layer.parentId);
  };

  // Filter layers to only show visible ones
  const visibleLayers = project?.layers.filter(isLayerVisible) || [];

  const handleStartEdit = (layerId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLayerId(layerId);
    setEditingName(currentName);
  };

  const handleFinishEdit = (layerId: string) => {
    if (editingName.trim() !== '') {
      renameLayer(layerId, editingName.trim());
    }
    setEditingLayerId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, layerId: string) => {
    if (e.key === 'Enter') {
      handleFinishEdit(layerId);
    } else if (e.key === 'Escape') {
      setEditingLayerId(null);
      setEditingName('');
    }
  };

  const handleExpandClick = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleGroupExpanded(layerId);
  };

  const handleLayerClick = (layerId: string, e: React.MouseEvent) => {
    // Don't handle if clicking on a button or input
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') {
      return;
    }

    // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      toggleLayerSelection(layerId);
    } else {
      selectLayer(layerId);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Capture selectedLayerIds immediately to avoid any timing issues
    const selectedIds = [...(project?.selectedLayerIds || [])];
    if (selectedIds.length > 0) {
      setLayersToDelete(selectedIds);
    }
  };

  const confirmDelete = () => {
    if (layersToDelete && layersToDelete.length > 0) {
      if (layersToDelete.length === 1) {
        deleteLayer(layersToDelete[0]);
      } else {
        deleteLayers(layersToDelete);
      }
      setLayersToDelete(null);
    }
  };

  const cancelDelete = () => {
    setLayersToDelete(null);
  };

  // Keyboard handler for Delete/Backspace keys
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger delete if editing layer name
      if (editingLayerId) return;

      // Don't trigger if focused on input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const selectedIds = project?.selectedLayerIds || [];
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        setLayersToDelete([...selectedIds]);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [project?.selectedLayerId, project?.selectedLayerIds, project?.layers, editingLayerId]);

  // Auto-scroll to selected layer
  useEffect(() => {
    const selectedId = project?.selectedLayerId;
    const element = layerRefs.current[selectedId];
    if (selectedId && element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [project?.selectedLayerId]);

  return (
    <div className="layers-panel">
      <h2 className="panel-title">Layers</h2>
      <div className="layers-content">
        {!hasLayers ? (
          <p className="panel-empty">No layers yet. Import an SVG or Lottie file to get started.</p>
        ) : (
          <ul className="layers-list">
            {visibleLayers.map((layer) => {
              const isSelected = project.selectedLayerIds?.includes(layer.id) || project.selectedLayerId === layer.id;
              const layerHasChildren = hasChildren(layer.id);
              const isExpanded = expandedGroupIds.includes(layer.id);
              return (<li
                  key={layer.id}
                  ref={(el) => (layerRefs.current[layer.id] = el)}
                  className={`layer-item ${isSelected ? 'selected' : ''} ${layer.parentId ? 'child' : ''}`}
                  onClick={(e) => handleLayerClick(layer.id, e)}
                >
                  <div className="layer-info">
                    {layerHasChildren && (
                      <button
                        className="layer-expand-btn"
                        onClick={(e) => handleExpandClick(layer.id, e)}
                        aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    )}
                    {editingLayerId === layer.id ? (
                      <input
                        type="text"
                        className="layer-name-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleFinishEdit(layer.id)}
                        onKeyDown={(e) => handleKeyDown(e, layer.id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="layer-name"
                        onDoubleClick={(e) => handleStartEdit(layer.id, layer.name, e)}
                      >
                        {layer.name}
                      </span>
                    )}
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
                    <button
                      className="layer-control-btn layer-delete-btn"
                      onClick={handleDeleteClick}
                      aria-label="Delete selected layers"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {layersToDelete && layersToDelete.length > 0 && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Layer{layersToDelete.length > 1 ? 's' : ''}</h3>
            <p>
              Are you sure you want to delete{' '}
              {layersToDelete.length === 1 ? (
                <strong>
                  {project?.layers.find((l) => l.id === layersToDelete[0])?.name || 'this layer'}
                </strong>
              ) : (
                <strong>{layersToDelete.length} layers</strong>
              )}
              ?
            </p>
            <p className="modal-note">
              This will also delete all keyframes and child layers associated with{' '}
              {layersToDelete.length === 1 ? 'this layer' : 'these layers'}.
            </p>
            <div className="modal-actions">
              <button onClick={cancelDelete}>Cancel</button>
              <button onClick={confirmDelete} className="danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
