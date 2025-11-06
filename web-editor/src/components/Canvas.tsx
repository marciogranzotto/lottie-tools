import { useEffect, useRef } from 'react';
import './Canvas.css';
import { useStore } from '../store/useStore';
import { getValueAtTime, getColorAtTime } from '../engine/Interpolation';
import type { RectElement, CircleElement, EllipseElement, PathElement, PolygonElement, PolylineElement } from '../models/Element';

export function Canvas() {
  const project = useStore((state) => state.project);
  const getKeyframesForLayer = useStore((state) => state.getKeyframesForLayer);
  const selectLayer = useStore((state) => state.selectLayer);
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

      // Get interpolated colors
      const fillKeyframes = getKeyframesForLayer(layer.id, 'fill');
      const strokeKeyframes = getKeyframesForLayer(layer.id, 'stroke');

      const fill =
        fillKeyframes.length > 0
          ? getColorAtTime(fillKeyframes, project.currentTime)
          : layer.element.style.fill;

      const stroke =
        strokeKeyframes.length > 0
          ? getColorAtTime(strokeKeyframes, project.currentTime)
          : layer.element.style.stroke;

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

        // Only fill if there's a valid fill color (not 'none')
        if (fill && fill !== 'none') {
          ctx.fillStyle = fill;
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        }

        // Only stroke if there's a valid stroke color (not 'none')
        if (stroke && stroke !== 'none') {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = layer.element.style.strokeWidth || 1;
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
      } else if (layer.element.type === 'circle') {
        const circle = layer.element as CircleElement;
        ctx.beginPath();
        ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2);

        if (fill && fill !== 'none') {
          ctx.fillStyle = fill;
          ctx.fill();
        }

        if (stroke && stroke !== 'none') {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = layer.element.style.strokeWidth || 1;
          ctx.stroke();
        }
      } else if (layer.element.type === 'ellipse') {
        const ellipse = layer.element as EllipseElement;
        ctx.beginPath();
        ctx.ellipse(ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry, 0, 0, Math.PI * 2);

        if (fill && fill !== 'none') {
          ctx.fillStyle = fill;
          ctx.fill();
        }

        if (stroke && stroke !== 'none') {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = layer.element.style.strokeWidth || 1;
          ctx.stroke();
        }
      } else if (layer.element.type === 'path') {
        const path = layer.element as PathElement;
        const path2d = new Path2D(path.d);

        if (fill && fill !== 'none') {
          ctx.fillStyle = fill;
          ctx.fill(path2d);
        }

        if (stroke) {
          ctx.strokeStyle = stroke;
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

          if (fill && fill !== 'none' && layer.element.type === 'polygon') {
            ctx.fillStyle = fill;
            ctx.fill();
          }

          if (stroke && stroke !== 'none') {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = layer.element.style.strokeWidth || 1;
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    });

    // Draw selection box AFTER all layers (so it's always on top)
    const selectedLayer = project.layers.find(layer => layer.id === project.selectedLayerId);
    if (selectedLayer) {
      // Get interpolated transforms for selected layer
      const xKeyframes = getKeyframesForLayer(selectedLayer.id, 'x');
      const yKeyframes = getKeyframesForLayer(selectedLayer.id, 'y');
      const rotationKeyframes = getKeyframesForLayer(selectedLayer.id, 'rotation');
      const scaleXKeyframes = getKeyframesForLayer(selectedLayer.id, 'scaleX');
      const scaleYKeyframes = getKeyframesForLayer(selectedLayer.id, 'scaleY');

      const x = xKeyframes.length > 0 ? getValueAtTime(xKeyframes, project.currentTime) : selectedLayer.element.transform.x;
      const y = yKeyframes.length > 0 ? getValueAtTime(yKeyframes, project.currentTime) : selectedLayer.element.transform.y;
      const rotation = rotationKeyframes.length > 0 ? getValueAtTime(rotationKeyframes, project.currentTime) : selectedLayer.element.transform.rotation;
      const scaleX = scaleXKeyframes.length > 0 ? getValueAtTime(scaleXKeyframes, project.currentTime) : selectedLayer.element.transform.scaleX;
      const scaleY = scaleYKeyframes.length > 0 ? getValueAtTime(scaleYKeyframes, project.currentTime) : selectedLayer.element.transform.scaleY;

      // Calculate bounding box based on element type
      let bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

      if (selectedLayer.element.type === 'rect') {
        const rect = selectedLayer.element as RectElement;
        bounds = {
          minX: rect.x,
          minY: rect.y,
          maxX: rect.x + rect.width,
          maxY: rect.y + rect.height,
        };
      } else if (selectedLayer.element.type === 'circle') {
        const circle = selectedLayer.element as CircleElement;
        bounds = {
          minX: circle.cx - circle.r,
          minY: circle.cy - circle.r,
          maxX: circle.cx + circle.r,
          maxY: circle.cy + circle.r,
        };
      } else if (selectedLayer.element.type === 'ellipse') {
        const ellipse = selectedLayer.element as EllipseElement;
        bounds = {
          minX: ellipse.cx - ellipse.rx,
          minY: ellipse.cy - ellipse.ry,
          maxX: ellipse.cx + ellipse.rx,
          maxY: ellipse.cy + ellipse.ry,
        };
      } else if (selectedLayer.element.type === 'path') {
        // Parse path data to find bounding box
        const path = selectedLayer.element as PathElement;
        const coords = extractPathCoordinates(path.d);

        if (coords.length > 0) {
          let minX = coords[0].x, minY = coords[0].y, maxX = coords[0].x, maxY = coords[0].y;
          coords.forEach(coord => {
            minX = Math.min(minX, coord.x);
            maxX = Math.max(maxX, coord.x);
            minY = Math.min(minY, coord.y);
            maxY = Math.max(maxY, coord.y);
          });
          bounds = { minX, minY, maxX, maxY };
        } else {
          bounds = { minX: -50, minY: -50, maxX: 50, maxY: 50 };
        }
      } else if (selectedLayer.element.type === 'polygon' || selectedLayer.element.type === 'polyline') {
        const poly = selectedLayer.element as PolygonElement | PolylineElement;
        const points = poly.points.trim().split(/[\s,]+/).map(Number);
        if (points.length >= 2) {
          let minX = points[0], minY = points[1], maxX = points[0], maxY = points[1];
          for (let i = 0; i < points.length; i += 2) {
            minX = Math.min(minX, points[i]);
            maxX = Math.max(maxX, points[i]);
            minY = Math.min(minY, points[i + 1]);
            maxY = Math.max(maxY, points[i + 1]);
          }
          bounds = { minX, minY, maxX, maxY };
        }
      }

      // Draw selection box with transform
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scaleX, scaleY);

      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 2 / Math.max(scaleX, scaleY); // Adjust line width for scale
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        bounds.minX - 4,
        bounds.minY - 4,
        bounds.maxX - bounds.minX + 8,
        bounds.maxY - bounds.minY + 8
      );
      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [project, project?.currentTime, project?.layers, project?.keyframes, getKeyframesForLayer]);

  // Handle canvas clicks to select/deselect layers
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!project || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check each layer in reverse order (top to bottom)
    for (let i = project.layers.length - 1; i >= 0; i--) {
      const layer = project.layers[i];
      if (!layer.visible) continue;

      // Get interpolated transforms
      const xKeyframes = getKeyframesForLayer(layer.id, 'x');
      const yKeyframes = getKeyframesForLayer(layer.id, 'y');
      const x = xKeyframes.length > 0 ? getValueAtTime(xKeyframes, project.currentTime) : layer.element.transform.x;
      const y = yKeyframes.length > 0 ? getValueAtTime(yKeyframes, project.currentTime) : layer.element.transform.y;

      // Simple hit test (check if click is within layer bounds)
      const isHit = checkHit(layer.element, clickX - x, clickY - y);

      if (isHit) {
        selectLayer(layer.id);
        return;
      }
    }

    // If no layer was clicked, deselect
    selectLayer(undefined);
  };

  // Extract coordinates from SVG path data for bounding box calculation
  const extractPathCoordinates = (pathData: string): Array<{ x: number, y: number }> => {
    const coords: Array<{ x: number, y: number }> = [];
    let currentX = 0;
    let currentY = 0;

    // Parse path commands more accurately
    const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];

    commands.forEach(cmd => {
      const type = cmd[0].toUpperCase();
      const values = cmd.slice(1).trim().match(/-?\d+\.?\d*/g)?.map(parseFloat) || [];

      switch (type) {
        case 'M': // Move to
          if (values.length >= 2) {
            currentX = values[0];
            currentY = values[1];
            coords.push({ x: currentX, y: currentY });
          }
          break;
        case 'L': // Line to
          for (let i = 0; i < values.length; i += 2) {
            if (i + 1 < values.length) {
              currentX = values[i];
              currentY = values[i + 1];
              coords.push({ x: currentX, y: currentY });
            }
          }
          break;
        case 'H': // Horizontal line
          values.forEach(x => {
            currentX = x;
            coords.push({ x: currentX, y: currentY });
          });
          break;
        case 'V': // Vertical line
          values.forEach(y => {
            currentY = y;
            coords.push({ x: currentX, y: currentY });
          });
          break;
        case 'C': // Cubic bezier
          for (let i = 0; i < values.length; i += 6) {
            if (i + 5 < values.length) {
              // Add control points and end point
              coords.push({ x: values[i], y: values[i + 1] });
              coords.push({ x: values[i + 2], y: values[i + 3] });
              coords.push({ x: values[i + 4], y: values[i + 5] });
              currentX = values[i + 4];
              currentY = values[i + 5];
            }
          }
          break;
        case 'S': // Smooth cubic bezier
          for (let i = 0; i < values.length; i += 4) {
            if (i + 3 < values.length) {
              coords.push({ x: values[i], y: values[i + 1] });
              coords.push({ x: values[i + 2], y: values[i + 3] });
              currentX = values[i + 2];
              currentY = values[i + 3];
            }
          }
          break;
      }
    });

    return coords;
  };

  // Simple hit testing for different element types
  const checkHit = (element: any, localX: number, localY: number): boolean => {
    if (element.type === 'rect') {
      const rect = element as RectElement;
      return localX >= rect.x && localX <= rect.x + rect.width &&
             localY >= rect.y && localY <= rect.y + rect.height;
    } else if (element.type === 'circle') {
      const circle = element as CircleElement;
      const dx = localX - circle.cx;
      const dy = localY - circle.cy;
      return (dx * dx + dy * dy) <= (circle.r * circle.r);
    } else if (element.type === 'ellipse') {
      const ellipse = element as EllipseElement;
      const dx = (localX - ellipse.cx) / ellipse.rx;
      const dy = (localY - ellipse.cy) / ellipse.ry;
      return (dx * dx + dy * dy) <= 1;
    } else if (element.type === 'path') {
      // For paths, extract coordinates and use bounding box hit test
      const path = element as PathElement;
      const coords = extractPathCoordinates(path.d);

      if (coords.length > 0) {
        let minX = coords[0].x, minY = coords[0].y, maxX = coords[0].x, maxY = coords[0].y;
        coords.forEach(coord => {
          minX = Math.min(minX, coord.x);
          maxX = Math.max(maxX, coord.x);
          minY = Math.min(minY, coord.y);
          maxY = Math.max(maxY, coord.y);
        });
        return localX >= minX && localX <= maxX && localY >= minY && localY <= maxY;
      }
      return false;
    } else if (element.type === 'polygon' || element.type === 'polyline') {
      const poly = element as PolygonElement | PolylineElement;
      const points = poly.points.trim().split(/[\s,]+/).map(Number);
      if (points.length >= 2) {
        let minX = points[0], minY = points[1], maxX = points[0], maxY = points[1];
        for (let i = 0; i < points.length; i += 2) {
          minX = Math.min(minX, points[i]);
          maxX = Math.max(maxX, points[i]);
          minY = Math.min(minY, points[i + 1]);
          maxY = Math.max(maxY, points[i + 1]);
        }
        return localX >= minX && localX <= maxX && localY >= minY && localY <= maxY;
      }
    }
    return false;
  };

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="canvas"
          width={project?.width || 800}
          height={project?.height || 600}
          onClick={handleCanvasClick}
          style={{ cursor: 'pointer' }}
        />
        <div className="canvas-info">
          {project?.width} × {project?.height}px @ {project?.fps}fps
        </div>
      </div>
    </div>
  );
}
