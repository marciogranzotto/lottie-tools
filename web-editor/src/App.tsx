import './App.css';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { PreviewPanel } from './components/PreviewPanel';
import { Timeline } from './components/Timeline';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayersPanel } from './components/LayersPanel';
import { Toaster } from 'sonner';
import { useStore } from './store/useStore';

function App() {
  const previewMode = useStore((state) => state.previewMode);

  return (
    <div className="app">
      <Toolbar />
      <div className="app-body">
        <LayersPanel />
        <div className="app-center">
          {previewMode === 'editor' && <Canvas />}
          {previewMode === 'lottie' && <PreviewPanel />}
          {previewMode === 'comparison' && (
            <div className="comparison-view">
              <div className="comparison-pane">
                <div className="comparison-label">Editor Canvas</div>
                <Canvas />
              </div>
              <div className="comparison-divider" />
              <div className="comparison-pane">
                <div className="comparison-label">Lottie Preview</div>
                <PreviewPanel />
              </div>
            </div>
          )}
          <Timeline />
        </div>
        <PropertiesPanel />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
