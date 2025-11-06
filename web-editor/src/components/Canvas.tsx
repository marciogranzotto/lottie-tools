import { useEffect, useRef } from 'react';
import './Canvas.css';
import { useStore } from '../store/useStore';
import { getValueAtTime } from '../engine/Interpolation';
import type { RectElement } from '../models/Element';

export function Canvas() {
  const project = useStore((state) => state.project);
  const getKeyframesForLayer = useStore((state) => state.getKeyframesForLayer);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render layers on canvas
  useEffect(() => {
    if (!canvasRef.current || !project) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render each visible layer
    project.layers.forEach((layer) => {
      if (!layer.visible) return;

      // Get interpolated position based on keyframes
      const xKeyframes = getKeyframesForLayer(layer.id, 'x');
      const yKeyframes = getKeyframesForLayer(layer.id, 'y');

      const x =
        xKeyframes.length > 0
          ? getValueAtTime(xKeyframes, project.currentTime)
          : layer.element.transform.x;

      const y =
        yKeyframes.length > 0
          ? getValueAtTime(yKeyframes, project.currentTime)
          : layer.element.transform.y;

      // Draw based on element type
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((layer.element.transform.rotation * Math.PI) / 180);
      ctx.scale(layer.element.transform.scaleX, layer.element.transform.scaleY);

      if (layer.element.type === 'rect') {
        const rect = layer.element as RectElement;
        ctx.fillStyle = layer.element.style.fill || '#ffffff';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        if (layer.element.style.stroke) {
          ctx.strokeStyle = layer.element.style.stroke;
          ctx.lineWidth = layer.element.style.strokeWidth || 1;
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
      }
      // TODO: Add support for other element types (circle, path, etc.)

      ctx.restore();
    });
  }, [project, project?.currentTime, project?.layers, project?.keyframes, getKeyframesForLayer]);

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="canvas"
          width={project?.width || 800}
          height={project?.height || 600}
        />
        <div className="canvas-info">
          {project?.width} × {project?.height}px @ {project?.fps}fps
        </div>
      </div>
    </div>
  );
}
