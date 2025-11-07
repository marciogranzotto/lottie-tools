import './Toolbar.css';
import { FileImport } from './FileImport';
import { useStore } from '../store/useStore';
import { LottieExporter } from '../export/LottieExporter';

export function Toolbar() {
  const project = useStore((state) => state.project);

  const handleExport = () => {
    if (!project) {
      alert('No project to export');
      return;
    }

    if (project.layers.length === 0) {
      alert('Project has no layers. Please add some content before exporting.');
      return;
    }

    try {
      LottieExporter.downloadJSON(project);
      alert('Animation exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export animation. Check console for details.');
    }
  };

  return (
    <div className="toolbar">
      <h1 className="toolbar-title">Lottie Open Studio</h1>
      <div className="toolbar-actions">
        <FileImport />
        <button disabled>Import Lottie</button>
        <button onClick={handleExport} disabled={!project || project.layers.length === 0}>
          Export to Lottie
        </button>
      </div>
    </div>
  );
}
