import { useEffect, useRef } from 'react';
import './Canvas.css';
import { useStore } from '../store/useStore';
import { getValueAtTime } from '../engine/Interpolation';
import type { RectElement, CircleElement, EllipseElement, PathElement, PolygonElement, PolylineElement } from '../models/Element';

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

      // Get interpolated values based on keyframes
      const xKeyframes = getKeyframesForLayer(layer.id, 'x');
      const yKeyframes = getKeyframesForLayer(layer.id, 'y');
      const rotationKeyframes = getKeyframesForLayer(layer.id, 'rotation');
      const scaleXKeyframes = getKeyframesForLayer(layer.id, 'scaleX');
      const scaleYKeyframes = getKeyframesForLayer(layer.id, 'scaleY');
      const opacityKeyframes = getKeyframesForLayer(layer.id, 'opacity');

      const x =
        xKeyframes.length > 0
          ? getValueAtTime(xKeyframes, project.currentTime)
          : layer.element.transform.x;

      const y =
        yKeyframes.length > 0
          ? getValueAtTime(yKeyframes, project.currentTime)
          : layer.element.transform.y;

      const rotation =
        rotationKeyframes.length > 0
          ? getValueAtTime(rotationKeyframes, project.currentTime)
          : layer.element.transform.rotation;

      const scaleX =
        scaleXKeyframes.length > 0
          ? getValueAtTime(scaleXKeyframes, project.currentTime)
          : layer.element.transform.scaleX;

      const scaleY =
        scaleYKeyframes.length > 0
          ? getValueAtTime(scaleYKeyframes, project.currentTime)
          : layer.element.transform.scaleY;

      const opacity =
        opacityKeyframes.length > 0
          ? getValueAtTime(opacityKeyframes, project.currentTime)
          : (layer.element.style.opacity ?? 1);

      // Draw based on element type
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scaleX, scaleY);

      // Set opacity
      ctx.globalAlpha = opacity;

      // Render based on element type
      if (layer.element.type === 'rect') {
        const rect = layer.element as RectElement;
        ctx.fillStyle = layer.element.style.fill || '#ffffff';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        if (layer.element.style.stroke) {
          ctx.strokeStyle = layer.element.style.stroke;
          ctx.lineWidth = layer.element.style.strokeWidth || 1;
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
      } else if (layer.element.type === 'circle') {
        const circle = layer.element as CircleElement;
        ctx.beginPath();
        ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2);

        if (layer.element.style.fill) {
          ctx.fillStyle = layer.element.style.fill;
          ctx.fill();
        }

        if (layer.element.style.stroke) {
          ctx.strokeStyle = layer.element.style.stroke;
          ctx.lineWidth = layer.element.style.strokeWidth || 1;
          ctx.stroke();
        }
      } else if (layer.element.type === 'ellipse') {
        const ellipse = layer.element as EllipseElement;
        ctx.beginPath();
        ctx.ellipse(ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry, 0, 0, Math.PI * 2);

        if (layer.element.style.fill) {
          ctx.fillStyle = layer.element.style.fill;
          ctx.fill();
        }

        if (layer.element.style.stroke) {
          ctx.strokeStyle = layer.element.style.stroke;
          ctx.lineWidth = layer.element.style.strokeWidth || 1;
          ctx.stroke();
        }
      } else if (layer.element.type === 'path') {
        const path = layer.element as PathElement;
        const path2d = new Path2D(path.d);

        if (layer.element.style.fill && layer.element.style.fill !== 'none') {
          ctx.fillStyle = layer.element.style.fill;
          ctx.fill(path2d);
        }

        if (layer.element.style.stroke) {
          ctx.strokeStyle = layer.element.style.stroke;
          ctx.lineWidth = layer.element.style.strokeWidth || 1;
          ctx.stroke(path2d);
        }
      } else if (layer.element.type === 'polygon' || layer.element.type === 'polyline') {
        const poly = layer.element as PolygonElement | PolylineElement;
        const points = poly.points.trim().split(/[\s,]+/).map(Number);

        if (points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(points[0], points[1]);

          for (let i = 2; i < points.length; i += 2) {
            ctx.lineTo(points[i], points[i + 1]);
          }

          if (layer.element.type === 'polygon') {
            ctx.closePath();
          }

          if (layer.element.style.fill && layer.element.type === 'polygon') {
            ctx.fillStyle = layer.element.style.fill;
            ctx.fill();
          }

          if (layer.element.style.stroke) {
            ctx.strokeStyle = layer.element.style.stroke;
            ctx.lineWidth = layer.element.style.strokeWidth || 1;
            ctx.stroke();
          }
        }
      }

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
