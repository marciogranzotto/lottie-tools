import { useRef, useState } from 'react';
import { parseSVG } from '../parsers/svg-parser';
import { LottieImporter } from '../import/LottieImporter';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import './FileImport.css';

type MessageType = 'error' | 'loading';

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

      // Detect file type
      const isJSON = file.name.endsWith('.json') || content.trim().startsWith('{');

      if (isJSON) {
        // Import Lottie JSON
        const lottieJson = JSON.parse(content);
        const importResult = LottieImporter.importFromLottie(lottieJson);

        if (!importResult.success) {
          setMessage({
            type: 'error',
            text: `Failed to import Lottie: ${importResult.error}`,
          });
          setIsProcessing(false);
          return;
        }

        // Replace project with imported Lottie
        setProject(importResult.project!);

        // Show warnings if any
        if (importResult.warnings && importResult.warnings.length > 0) {
          importResult.warnings.forEach((warning) => {
            toast.warning(warning);
          });
        }

        // Show success toast
        toast.success(
          `Successfully imported Lottie animation with ${importResult.project!.layers.length} layer${
            importResult.project!.layers.length === 1 ? '' : 's'
          }`
        );
        setMessage(null);
      } else {
        // Import SVG
        const groupName = file.name.replace(/\.[^/.]+$/, '');
        const parseResult = parseSVG(content, groupName);

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
          // Merge with existing project, updating dimensions if available
          setProject({
            ...project,
            width: parseResult.width || project.width,
            height: parseResult.height || project.height,
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
            selectedLayerIds: [],
            keyframes: [],
            loop: false,
          });
        }

        // Show success toast
        toast.success(
          `Successfully imported ${parseResult.layers.length} layer${
            parseResult.layers.length === 1 ? '' : 's'
          }`
        );

        // Show warnings if any (e.g., unsupported elements)
        if (parseResult.warnings && parseResult.warnings.length > 0) {
          parseResult.warnings.forEach((warning) => {
            toast.warning(warning, { duration: 5000 });
          });
        }

        setMessage(null);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to read file',
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
        accept=".svg,.json,image/svg+xml,application/json"
        onChange={handleFileChange}
        aria-label="Import SVG or Lottie"
        style={{ display: 'none' }}
      />
      <button
        onClick={handleButtonClick}
        disabled={isProcessing}
        aria-label="Import SVG or Lottie"
      >
        Import
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
