/**
 * Utility to convert SVG path data to Lottie bezier format
 */

export interface LottiePathData {
  i: number[][];  // in tangents
  o: number[][];  // out tangents
  v: number[][];  // vertices
  c: boolean;     // closed
}

interface PathCommand {
  type: string;
  values: number[];
}

/**
 * Parse SVG path data string into commands
 */
function parsePathData(d: string): PathCommand[] {
  const commands: PathCommand[] = [];

  // Match command letters followed by numbers
  const commandRegex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match;

  while ((match = commandRegex.exec(d)) !== null) {
    const type = match[1];
    const valuesStr = match[2].trim();

    // Parse numbers from the values string
    const values: number[] = [];
    if (valuesStr) {
      const numberRegex = /-?[\d.]+(?:e-?\d+)?/g;
      let numMatch;
      while ((numMatch = numberRegex.exec(valuesStr)) !== null) {
        values.push(parseFloat(numMatch[0]));
      }
    }

    commands.push({ type, values });
  }

  return commands;
}

/**
 * Convert SVG path commands to Lottie bezier format
 */
export function svgPathToLottiePath(d: string): LottiePathData {
  const commands = parsePathData(d);

  const vertices: number[][] = [];
  const inTangents: number[][] = [];
  const outTangents: number[][] = [];
  let closed = false;

  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;

  for (const cmd of commands) {
    const { type, values } = cmd;

    switch (type.toUpperCase()) {
      case 'M': // Move to
        if (type === 'M') {
          // Absolute
          currentX = values[0];
          currentY = values[1];
        } else {
          // Relative
          currentX += values[0];
          currentY += values[1];
        }
        startX = currentX;
        startY = currentY;

        // Add vertex for move
        vertices.push([currentX, currentY]);
        inTangents.push([0, 0]);
        outTangents.push([0, 0]);
        break;

      case 'L': // Line to
        if (type === 'L') {
          currentX = values[0];
          currentY = values[1];
        } else {
          currentX += values[0];
          currentY += values[1];
        }

        vertices.push([currentX, currentY]);
        inTangents.push([0, 0]);
        outTangents.push([0, 0]);
        break;

      case 'H': // Horizontal line
        if (type === 'H') {
          currentX = values[0];
        } else {
          currentX += values[0];
        }

        vertices.push([currentX, currentY]);
        inTangents.push([0, 0]);
        outTangents.push([0, 0]);
        break;

      case 'V': // Vertical line
        if (type === 'V') {
          currentY = values[0];
        } else {
          currentY += values[0];
        }

        vertices.push([currentX, currentY]);
        inTangents.push([0, 0]);
        outTangents.push([0, 0]);
        break;

      case 'C': // Cubic bezier
        {
          let x1, y1, x2, y2, x, y;

          if (type === 'C') {
            // Absolute
            x1 = values[0];
            y1 = values[1];
            x2 = values[2];
            y2 = values[3];
            x = values[4];
            y = values[5];
          } else {
            // Relative
            x1 = currentX + values[0];
            y1 = currentY + values[1];
            x2 = currentX + values[2];
            y2 = currentY + values[3];
            x = currentX + values[4];
            y = currentY + values[5];
          }

          // Set out tangent for previous vertex (relative to vertex)
          if (vertices.length > 0) {
            const prevIdx = vertices.length - 1;
            outTangents[prevIdx] = [
              x1 - vertices[prevIdx][0],
              y1 - vertices[prevIdx][1]
            ];
          }

          // Add new vertex
          vertices.push([x, y]);

          // Set in tangent for new vertex (relative to vertex)
          inTangents.push([x2 - x, y2 - y]);
          outTangents.push([0, 0]);

          currentX = x;
          currentY = y;
        }
        break;

      case 'Q': // Quadratic bezier
        {
          let x1, y1, x, y;

          if (type === 'Q') {
            x1 = values[0];
            y1 = values[1];
            x = values[2];
            y = values[3];
          } else {
            x1 = currentX + values[0];
            y1 = currentY + values[1];
            x = currentX + values[2];
            y = currentY + values[3];
          }

          // Convert quadratic to cubic bezier
          // Control points are 2/3 of the way from start/end to control point
          if (vertices.length > 0) {
            const prevIdx = vertices.length - 1;
            const startX = vertices[prevIdx][0];
            const startY = vertices[prevIdx][1];

            const cp1x = startX + (2 / 3) * (x1 - startX);
            const cp1y = startY + (2 / 3) * (y1 - startY);
            const cp2x = x + (2 / 3) * (x1 - x);
            const cp2y = y + (2 / 3) * (y1 - y);

            outTangents[prevIdx] = [cp1x - startX, cp1y - startY];

            vertices.push([x, y]);
            inTangents.push([cp2x - x, cp2y - y]);
            outTangents.push([0, 0]);
          }

          currentX = x;
          currentY = y;
        }
        break;

      case 'Z': // Close path
        closed = true;
        currentX = startX;
        currentY = startY;
        break;

      // Add more command types as needed (S, T, A, etc.)
    }
  }

  return {
    v: vertices,
    i: inTangents,
    o: outTangents,
    c: closed
  };
}
