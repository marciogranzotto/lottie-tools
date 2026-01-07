import { useEffect, useRef, useState } from 'react';
import './Canvas.css';
import { useStore } from '../store/useStore';
import { getValueAtTime, getColorAtTime } from '../engine/Interpolation';
import type {
  RectElement,
  CircleElement,
  EllipseElement,
  PathElement,
  PolygonElement,
  PolylineElement,
  GroupElement,
  AnyElement,
} from '../models/Element';

export function Canvas() {
  const project = useStore((state) => state.project);
  const getKeyframesForLayer = useStore((state) => state.getKeyframesForLayer);
  const selectLayer = useStore((state) => state.selectLayer);
  const canvasZoom = useStore((state) => state.canvasZoom);
  const canvasPan = useStore((state) => state.canvasPan);
  const setCanvasZoom = useStore((state) => state.setCanvasZoom);
  const setCanvasPan = useStore((state) => state.setCanvasPan);
  const resetCanvasView = useStore((state) => state.resetCanvasView);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  /**
   * Recursively render an element and its children (for groups)
   */
  const renderElement = (
    element: AnyElement,
    ctx: CanvasRenderingContext2D,
    inheritedOpacity: number
  ) => {
    // Apply element's transform
    ctx.save();
    ctx.translate(element.transform.x, element.transform.y);
    ctx.rotate((element.transform.rotation * Math.PI) / 180);
    ctx.scale(element.transform.scaleX, element.transform.scaleY);

    // Apply opacity (compound with inherited)
    const elementOpacity = element.style.opacity ?? 1;
    const finalOpacity = inheritedOpacity * elementOpacity;
    ctx.globalAlpha = finalOpacity;

    // Render based on type
    if (element.type === 'group') {
      const group = element as GroupElement;
      // Recursively render each child
      group.children.forEach((child) => {
        renderElement(child, ctx, finalOpacity);
      });
    } else if (element.type === 'rect') {
      const rect = element as RectElement;
      const fill = element.style.fill;
      const stroke = element.style.stroke;
      const strokeWidth = element.style.strokeWidth ?? 1;

      if (fill && fill !== 'none') {
        ctx.fillStyle = fill;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
      if (stroke && stroke !== 'none') {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
    } else if (element.type === 'circle') {
      const circle = element as CircleElement;
      const fill = element.style.fill;
      const stroke = element.style.stroke;
      const strokeWidth = element.style.strokeWidth ?? 1;

      ctx.beginPath();
      ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2);
      if (fill && fill !== 'none') {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke && stroke !== 'none') {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    } else if (element.type === 'ellipse') {
      const ellipse = element as EllipseElement;
      const fill = element.style.fill;
      const stroke = element.style.stroke;
      const strokeWidth = element.style.strokeWidth ?? 1;

      ctx.beginPath();
      ctx.ellipse(ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry, 0, 0, Math.PI * 2);
      if (fill && fill !== 'none') {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke && stroke !== 'none') {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    } else if (element.type === 'path') {
      const path = element as PathElement;
      const fill = element.style.fill;
      const stroke = element.style.stroke;
      const strokeWidth = element.style.strokeWidth ?? 1;

      const path2d = new Path2D(path.d);
      if (fill && fill !== 'none') {
        ctx.fillStyle = fill;
        ctx.fill(path2d);
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke(path2d);
      }
    } else if (element.type === 'polygon' || element.type === 'polyline') {
      const poly = element as PolygonElement | PolylineElement;
      const fill = element.style.fill;
      const stroke = element.style.stroke;
      const strokeWidth = element.style.strokeWidth ?? 1;

      const points = poly.points.trim().split(/[\s,]+/).map(Number);
      if (points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
          ctx.lineTo(points[i], points[i + 1]);
        }
        if (element.type === 'polygon') {
          ctx.closePath();
        }
        if (fill && fill !== 'none' && element.type === 'polygon') {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke && stroke !== 'none') {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  };

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
      const strokeWidthKeyframes = getKeyframesForLayer(layer.id, 'strokeWidth');

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

      const strokeWidth =
        strokeWidthKeyframes.length > 0
          ? getValueAtTime(strokeWidthKeyframes, project.currentTime)
          : (layer.element.style.strokeWidth ?? 1);

      // Draw based on element type
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scaleX, scaleY);

      // Set opacity
      ctx.globalAlpha = opacity;

      // Create a renderable element with keyframe-interpolated style values
      // This allows layer-level animation to work while supporting groups
      const renderableElement: AnyElement = {
        ...layer.element,
        style: {
          ...layer.element.style,
          fill: fill,
          stroke: stroke,
          strokeWidth: strokeWidth,
        },
      };

      // Use recursive renderer for all element types (including groups)
      // Note: opacity is already applied via ctx.globalAlpha above (line 236)
      // So we pass 1.0 as inheritedOpacity to avoid double-applying it
      renderElement(renderableElement, ctx, 1.0);

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

  // Transform screen coordinates to canvas coordinates (accounting for zoom and pan)
  const screenToCanvas = (screenX: number, screenY: number): { x: number; y: number } => {
    if (!containerRef.current || !wrapperRef.current) return { x: 0, y: 0 };

    // Get container position in screen space
    const containerRect = containerRef.current.getBoundingClientRect();

    // Get wrapper's untransformed position relative to container
    // (offsetLeft/Top give pre-transform positions)
    const wrapperOffsetX = wrapperRef.current.offsetLeft;
    const wrapperOffsetY = wrapperRef.current.offsetTop;

    // Calculate wrapper's top-left corner in screen space (before transform)
    const wrapperScreenX = containerRect.left + wrapperOffsetX;
    const wrapperScreenY = containerRect.top + wrapperOffsetY;

    // Get position relative to wrapper's origin
    const relX = screenX - wrapperScreenX;
    const relY = screenY - wrapperScreenY;

    // Apply inverse transform: (point - translation) / scale
    const canvasX = (relX - canvasPan.x) / canvasZoom;
    const canvasY = (relY - canvasPan.y) / canvasZoom;

    return { x: canvasX, y: canvasY };
  };

  // Handle canvas clicks to select/deselect layers
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!project || !canvasRef.current) return;

    const { x: clickX, y: clickY } = screenToCanvas(event.clientX, event.clientY);

    // Check each layer in reverse order (top to bottom)
    for (let i = project.layers.length - 1; i >= 0; i--) {
      const layer = project.layers[i];
      if (!layer.visible) continue;

      // Get interpolated transforms
      const xKeyframes = getKeyframesForLayer(layer.id, 'x');
      const yKeyframes = getKeyframesForLayer(layer.id, 'y');
      const x = xKeyframes.length > 0 ? getValueAtTime(xKeyframes, project.currentTime) : layer.element.transform.x;
      const y = yKeyframes.length > 0 ? getValueAtTime(yKeyframes, project.currentTime) : layer.element.transform.y;

      // Hit test (handle both simple elements and groups)
      let isHit = false;
      if (layer.element.type === 'group') {
        const ctx = canvasRef.current!.getContext('2d')!;
        isHit = checkGroupHit(layer.element as GroupElement, clickX - x, clickY - y, ctx);
      } else {
        isHit = checkHit(layer.element, clickX - x, clickY - y);
      }

      if (isHit) {
        // If layer has a parent, select the parent instead (single-click behavior)
        if (layer.parentId) {
          selectLayer(layer.parentId);
        } else {
          selectLayer(layer.id);
        }
        return;
      }
    }

    // If no layer was clicked, deselect
    selectLayer(undefined);
  };

  // Calculate the bounding box area of an element
  const getElementArea = (element: AnyElement): number => {
    switch (element.type) {
      case 'rect': {
        const rect = element as RectElement;
        return rect.width * rect.height;
      }
      case 'circle': {
        const circle = element as CircleElement;
        return Math.PI * circle.r * circle.r;
      }
      case 'ellipse': {
        const ellipse = element as EllipseElement;
        return Math.PI * ellipse.rx * ellipse.ry;
      }
      case 'path': {
        const path = element as PathElement;
        const coords = extractPathCoordinates(path.d);
        if (coords.length === 0) return 0;

        const xs = coords.map(c => c.x);
        const ys = coords.map(c => c.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return (maxX - minX) * (maxY - minY);
      }
      case 'polygon':
      case 'polyline': {
        const poly = element as PolygonElement | PolylineElement;
        const points = poly.points.trim().split(/[\s,]+/).map(Number);
        if (points.length < 2) return 0;

        const xs: number[] = [];
        const ys: number[] = [];
        for (let i = 0; i < points.length; i += 2) {
          xs.push(points[i]);
          ys.push(points[i + 1]);
        }
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return (maxX - minX) * (maxY - minY);
      }
      default:
        return 0;
    }
  };

  // Calculate distance from click point to element center
  const getDistanceToCenter = (element: AnyElement, localX: number, localY: number): number => {
    let centerX = 0;
    let centerY = 0;

    switch (element.type) {
      case 'rect': {
        const rect = element as RectElement;
        centerX = rect.x + rect.width / 2;
        centerY = rect.y + rect.height / 2;
        break;
      }
      case 'circle': {
        const circle = element as CircleElement;
        centerX = circle.cx;
        centerY = circle.cy;
        break;
      }
      case 'ellipse': {
        const ellipse = element as EllipseElement;
        centerX = ellipse.cx;
        centerY = ellipse.cy;
        break;
      }
      case 'path': {
        const path = element as PathElement;
        const coords = extractPathCoordinates(path.d);
        if (coords.length > 0) {
          const xs = coords.map(c => c.x);
          const ys = coords.map(c => c.y);
          centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
          centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
        }
        break;
      }
      case 'polygon':
      case 'polyline': {
        const poly = element as PolygonElement | PolylineElement;
        const points = poly.points.trim().split(/[\s,]+/).map(Number);
        if (points.length >= 2) {
          const xs: number[] = [];
          const ys: number[] = [];
          for (let i = 0; i < points.length; i += 2) {
            xs.push(points[i]);
            ys.push(points[i + 1]);
          }
          centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
          centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
        }
        break;
      }
    }

    const dx = localX - centerX;
    const dy = localY - centerY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle double-click to select individual child layers with best match scoring
  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!project || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const { x: clickX, y: clickY } = screenToCanvas(event.clientX, event.clientY);

    // Collect all layers that pass hit test with their scores
    const candidates: Array<{ layerId: string; score: number }> = [];

    // Check each layer in reverse order (top to bottom in rendering order)
    // Skip group layers - only check actual shape layers for precise selection
    for (let i = project.layers.length - 1; i >= 0; i--) {
      const layer = project.layers[i];
      if (!layer.visible || layer.element.type === 'group') continue;

      // Apply transforms using canvas context to properly handle parent transforms
      ctx.save();

      // Apply parent transforms if this layer has a parent
      if (layer.parentId) {
        const parentLayer = project.layers.find(l => l.id === layer.parentId);
        if (parentLayer) {
          const parentX = parentLayer.element.transform.x;
          const parentY = parentLayer.element.transform.y;
          const parentRotation = parentLayer.element.transform.rotation;
          const parentScaleX = parentLayer.element.transform.scaleX;
          const parentScaleY = parentLayer.element.transform.scaleY;

          ctx.translate(parentX, parentY);
          ctx.rotate((parentRotation * Math.PI) / 180);
          ctx.scale(parentScaleX, parentScaleY);
        }
      }

      // Apply layer's own transform
      const xKeyframes = getKeyframesForLayer(layer.id, 'x');
      const yKeyframes = getKeyframesForLayer(layer.id, 'y');
      const x = xKeyframes.length > 0 ? getValueAtTime(xKeyframes, project.currentTime) : layer.element.transform.x;
      const y = yKeyframes.length > 0 ? getValueAtTime(yKeyframes, project.currentTime) : layer.element.transform.y;

      ctx.translate(x, y);

      // Transform click point to local coordinates
      const matrix = ctx.getTransform();
      const invMatrix = matrix.invertSelf();
      const localX = invMatrix.a * clickX + invMatrix.c * clickY + invMatrix.e;
      const localY = invMatrix.b * clickX + invMatrix.d * clickY + invMatrix.f;

      ctx.restore();

      // Hit test in local coordinates
      const isHit = checkHit(layer.element, localX, localY);

      if (isHit) {
        // Calculate score: prefer smaller elements closer to click point
        const area = getElementArea(layer.element);
        const distance = getDistanceToCenter(layer.element, localX, localY);

        // Score formula: lower is better
        // Normalize area (divide by 10000 to keep numbers manageable)
        // Weight distance more heavily than area
        const score = distance * 2 + Math.sqrt(area) / 100;

        candidates.push({ layerId: layer.id, score });
      }
    }

    // Select the layer with the best (lowest) score
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.score - b.score);
      selectLayer(candidates[0].layerId);
    } else {
      // If no layer was clicked, deselect
      selectLayer(undefined);
    }
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

  // Hit testing for group elements (recursively checks children)
  const checkGroupHit = (
    group: GroupElement,
    localX: number,
    localY: number,
    ctx: CanvasRenderingContext2D
  ): boolean => {
    // Check each child recursively
    for (const child of group.children) {
      ctx.save();
      ctx.translate(child.transform.x, child.transform.y);
      ctx.rotate((child.transform.rotation * Math.PI) / 180);
      ctx.scale(child.transform.scaleX, child.transform.scaleY);

      // Transform the click point to child's local coordinate space
      const transform = ctx.getTransform();
      const inverse = transform.invertSelf();
      const childLocalX = inverse.a * localX + inverse.c * localY + inverse.e;
      const childLocalY = inverse.b * localX + inverse.d * localY + inverse.f;

      let hit = false;
      if (child.type === 'group') {
        hit = checkGroupHit(child as GroupElement, childLocalX, childLocalY, ctx);
      } else {
        hit = checkHit(child, childLocalX, childLocalY);
      }

      ctx.restore();

      if (hit) return true;
    }
    return false;
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

  // Handle clicks outside the canvas to deselect
  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only deselect if clicking on the container itself, not the canvas
    if (event.target === event.currentTarget) {
      selectLayer(undefined);
    }
  };

  // Handle mouse wheel for zoom
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = canvasZoom + delta;

    // Zoom towards mouse position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Calculate the point in canvas space before zoom
      const canvasXBefore = (mouseX - canvasPan.x) / canvasZoom;
      const canvasYBefore = (mouseY - canvasPan.y) / canvasZoom;

      // Calculate the point in canvas space after zoom
      const canvasXAfter = (mouseX - canvasPan.x) / newZoom;
      const canvasYAfter = (mouseY - canvasPan.y) / newZoom;

      // Adjust pan to keep the point under the mouse
      const panDeltaX = (canvasXAfter - canvasXBefore) * newZoom;
      const panDeltaY = (canvasYAfter - canvasYBefore) * newZoom;

      setCanvasZoom(newZoom);
      setCanvasPan({
        x: canvasPan.x + panDeltaX,
        y: canvasPan.y + panDeltaY,
      });
    } else {
      setCanvasZoom(newZoom);
    }
  };

  // Handle mouse down for panning
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    // Pan with middle mouse button or Space+left click
    if (event.button === 1 || (event.button === 0 && isSpacePressed)) {
      event.preventDefault();
      setIsPanning(true);
      setPanStart({ x: event.clientX - canvasPan.x, y: event.clientY - canvasPan.y });
    }
  };

  // Handle mouse move for panning
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setCanvasPan({
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y,
      });
    }
  };

  // Handle mouse up to end panning
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Keyboard handler for Space key panning
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat && containerRef.current) {
        // Prevent space from triggering other actions (like scrolling)
        if (event.target === document.body || containerRef.current.contains(event.target as Node)) {
          event.preventDefault();
          setIsSpacePressed(true);
          containerRef.current.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && containerRef.current) {
        setIsSpacePressed(false);
        setIsPanning(false);
        containerRef.current.style.cursor = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onClick={handleContainerClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      <div
        ref={wrapperRef}
        className="canvas-wrapper"
        style={{
          transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
          transformOrigin: '0 0',
        }}
      >
        <canvas
          ref={canvasRef}
          className="canvas"
          width={project?.width || 800}
          height={project?.height || 600}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          style={{ cursor: 'pointer' }}
        />
        <div className="canvas-info">
          {project?.width} × {project?.height}px @ {project?.fps}fps
        </div>
      </div>
      {/* Canvas Controls */}
      <div className="canvas-controls">
        <button onClick={() => setCanvasZoom(canvasZoom + 0.2)} title="Zoom in">
          +
        </button>
        <span className="canvas-zoom-level">{Math.round(canvasZoom * 100)}%</span>
        <button onClick={() => setCanvasZoom(canvasZoom - 0.2)} title="Zoom out">
          -
        </button>
        <button onClick={resetCanvasView} title="Reset zoom and pan">
          Reset
        </button>
      </div>
    </div>
  );
}
