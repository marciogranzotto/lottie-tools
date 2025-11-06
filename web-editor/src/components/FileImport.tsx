import { useRef, useState } from 'react';
import { parseSVG } from '../parsers/svg-parser';
import { useStore } from '../store/useStore';
import './FileImport.css';

type MessageType = 'success' | 'error' | 'loading';

interface Message {
  type: MessageType;
  text: string;
}

export function FileImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const project = useStore((state) => state.project);
  const setProject = useStore((state) => state.setProject);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous message
    setMessage(null);
    setIsProcessing(true);
    setMessage({ type: 'loading', text: 'Importing...' });

    try {
      // Read file content
      const content = await readFileAsText(file);

      // Parse SVG
      const parseResult = parseSVG(content);

      if (!parseResult.success) {
        setMessage({
          type: 'error',
          text: `Failed to import SVG: ${parseResult.error}`,
        });
        setIsProcessing(false);
        return;
      }

      if (parseResult.layers.length === 0) {
        setMessage({
          type: 'error',
          text: 'No elements found in SVG',
        });
        setIsProcessing(false);
        return;
      }

      // Create or update project
      if (project) {
        // Merge with existing project
        setProject({
          ...project,
          layers: [...project.layers, ...parseResult.layers],
        });
      } else {
        // Create new project
        setProject({
          name: file.name,
          width: parseResult.width || 800,
          height: parseResult.height || 600,
          fps: 30,
          duration: 3,
          currentTime: 0,
          isPlaying: false,
          layers: parseResult.layers,
          selectedLayerId: undefined,
          keyframes: [],
        });
      }

      setMessage({
        type: 'success',
        text: `Successfully imported ${parseResult.layers.length} layer${
          parseResult.layers.length === 1 ? '' : 's'
        }`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to read file',
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="file-import">
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={handleFileChange}
        aria-label="Import SVG"
        style={{ display: 'none' }}
      />
      <button
        onClick={handleButtonClick}
        disabled={isProcessing}
        aria-label="Import SVG"
      >
        Import SVG
      </button>

      {message && (
        <div
          role="alert"
          className={`message ${message.type}`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

/**
 * Read file content as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
