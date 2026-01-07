import { describe, it, expect } from 'vitest';
import { parseSVG } from './svg-parser';
import type { SVGParseResult } from './svg-parser';

describe('SVG Parser', () => {
  describe('parseSVG', () => {
    it('should parse a simple rect element', () => {
      const svg = `
        <svg width="100" height="100">
          <rect x="10" y="20" width="50" height="30" fill="red"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers).toHaveLength(1);
      expect(result.layers[0].element.type).toBe('rect');
      expect(result.layers[0].element).toMatchObject({
        type: 'rect',
        x: 10,
        y: 20,
        width: 50,
        height: 30,
      });
      expect(result.layers[0].element.style.fill).toBe('red');
    });

    it('should parse a circle element', () => {
      const svg = `
        <svg>
          <circle cx="50" cy="50" r="25" stroke="blue" stroke-width="2"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.type).toBe('circle');
      expect(result.layers[0].element).toMatchObject({
        type: 'circle',
        cx: 50,
        cy: 50,
        r: 25,
      });
      expect(result.layers[0].element.style.stroke).toBe('blue');
      expect(result.layers[0].element.style.strokeWidth).toBe(2);
    });

    it('should parse an ellipse element', () => {
      const svg = `
        <svg>
          <ellipse cx="100" cy="50" rx="50" ry="25"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.type).toBe('ellipse');
      expect(result.layers[0].element).toMatchObject({
        type: 'ellipse',
        cx: 100,
        cy: 50,
        rx: 50,
        ry: 25,
      });
    });

    it('should parse a path element', () => {
      const svg = `
        <svg>
          <path d="M 10 10 L 50 50" fill="none" stroke="black"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.type).toBe('path');
      expect(result.layers[0].element).toMatchObject({
        type: 'path',
        d: 'M 10 10 L 50 50',
      });
    });

    it('should parse a polygon element', () => {
      const svg = `
        <svg>
          <polygon points="50,0 100,50 50,100 0,50"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.type).toBe('polygon');
      expect(result.layers[0].element).toMatchObject({
        type: 'polygon',
        points: '50,0 100,50 50,100 0,50',
      });
    });

    it('should parse multiple elements', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10"/>
          <circle cx="50" cy="50" r="10"/>
          <ellipse cx="100" cy="100" rx="20" ry="10"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers).toHaveLength(3);
      expect(result.layers[0].element.type).toBe('rect');
      expect(result.layers[1].element.type).toBe('circle');
      expect(result.layers[2].element.type).toBe('ellipse');
    });

    it('should parse groups with nested elements', () => {
      const svg = `
        <svg>
          <g id="myGroup">
            <rect x="10" y="10" width="20" height="20"/>
            <circle cx="50" cy="50" r="10"/>
          </g>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      // Should create 3 layers: 1 group + 2 children (flattened)
      expect(result.layers).toHaveLength(3);

      // First layer should be the group
      expect(result.layers[0].element.type).toBe('group');
      expect(result.layers[0].parentId).toBeUndefined();

      // Group element should still contain children for Canvas rendering
      const group = result.layers[0].element;
      if (group.type === 'group') {
        expect(group.children).toHaveLength(2);
        expect(group.children[0].type).toBe('rect');
        expect(group.children[1].type).toBe('circle');
      }

      // Second and third layers should be the rect and circle with parentId
      expect(result.layers[1].element.type).toBe('rect');
      expect(result.layers[1].parentId).toBe(result.layers[0].id);

      expect(result.layers[2].element.type).toBe('circle');
      expect(result.layers[2].parentId).toBe(result.layers[0].id);
    });

    it('should extract SVG viewBox dimensions', () => {
      const svg = `
        <svg viewBox="0 0 800 600">
          <rect x="0" y="0" width="10" height="10"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should extract SVG width/height attributes', () => {
      const svg = `
        <svg width="1920" height="1080">
          <rect x="0" y="0" width="10" height="10"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should handle opacity attribute', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10" opacity="0.5"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.style.opacity).toBe(0.5);
    });

    it('should generate unique IDs for elements', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10"/>
          <circle cx="50" cy="50" r="10"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].id).toBeTruthy();
      expect(result.layers[1].id).toBeTruthy();
      expect(result.layers[0].id).not.toBe(result.layers[1].id);
    });

    it('should use element ID attribute if present', () => {
      const svg = `
        <svg>
          <rect id="myRect" x="0" y="0" width="10" height="10"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.id).toBe('myRect');
    });

    it('should generate layer names from element types', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10"/>
          <circle cx="50" cy="50" r="10"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].name).toContain('Rect');
      expect(result.layers[1].name).toContain('Circle');
    });

    it('should handle invalid SVG gracefully', () => {
      const svg = '<not-valid-svg>';

      const result = parseSVG(svg);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle empty SVG', () => {
      const svg = '<svg></svg>';

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers).toHaveLength(0);
    });

    it('should ignore unsupported elements', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10"/>
          <text>Unsupported</text>
          <circle cx="50" cy="50" r="10"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers).toHaveLength(2);
      expect(result.layers[0].element.type).toBe('rect');
      expect(result.layers[1].element.type).toBe('circle');
    });

    it('should parse transform translate', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10" transform="translate(50, 100)"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.transform.x).toBe(50);
      expect(result.layers[0].element.transform.y).toBe(100);
    });

    it('should parse transform scale', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10" transform="scale(2, 0.5)"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.transform.scaleX).toBe(2);
      expect(result.layers[0].element.transform.scaleY).toBe(0.5);
    });

    it('should parse transform rotate', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10" transform="rotate(45)"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.transform.rotation).toBe(45);
    });

    it('should parse scale with single value', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10" transform="scale(2)"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.transform.scaleX).toBe(2);
      expect(result.layers[0].element.transform.scaleY).toBe(2);
    });

    it('should parse fill none', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10" fill="none"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.style.fill).toBeUndefined();
    });

    it('should parse stroke none', () => {
      const svg = `
        <svg>
          <rect x="0" y="0" width="10" height="10" stroke="none"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.style.stroke).toBeUndefined();
    });

    it('should handle polyline element', () => {
      const svg = `
        <svg>
          <polyline points="0,0 10,10 20,0"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.layers[0].element.type).toBe('polyline');
      expect(result.layers[0].element).toMatchObject({
        type: 'polyline',
        points: '0,0 10,10 20,0',
      });
    });
  });

  describe('Raster image detection', () => {
    it('should detect embedded raster images with href', () => {
      const svg = `
        <svg width="100" height="100">
          <rect x="10" y="10" width="50" height="50"/>
          <image href="data:image/png;base64,iVBOR..." x="0" y="0" width="100" height="100"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBe(1);
      expect(result.warnings?.[0]).toContain('embedded raster image');
      expect(result.warnings?.[0]).toContain('not be imported');
      expect(result.layers).toHaveLength(1); // Only rect imported
    });

    it('should detect embedded raster images with xlink:href', () => {
      const svg = `
        <svg width="100" height="100" xmlns:xlink="http://www.w3.org/1999/xlink">
          <circle cx="50" cy="50" r="25"/>
          <image xlink:href="photo.jpg" x="0" y="0" width="100" height="100"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('embedded raster image');
      expect(result.layers).toHaveLength(1); // Only circle imported
    });

    it('should detect multiple raster images with plural message', () => {
      const svg = `
        <svg width="100" height="100">
          <image href="image1.png" x="0" y="0" width="50" height="50"/>
          <image href="image2.jpg" x="50" y="50" width="50" height="50"/>
          <rect x="10" y="10" width="30" height="30"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('2 embedded raster images');
      expect(result.layers).toHaveLength(1); // Only rect imported
    });

    it('should detect single raster image with singular message', () => {
      const svg = `
        <svg width="100" height="100">
          <image href="image.png" x="0" y="0" width="50" height="50"/>
          <rect x="10" y="10" width="30" height="30"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('1 embedded raster image');
    });

    it('should detect nested raster images in groups', () => {
      const svg = `
        <svg width="100" height="100">
          <g id="group1">
            <rect x="10" y="10" width="30" height="30"/>
            <image href="nested.png" x="0" y="0" width="100" height="100"/>
          </g>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('embedded raster image');
    });

    it('should detect foreignObject elements', () => {
      const svg = `
        <svg width="100" height="100">
          <rect x="10" y="10" width="30" height="30"/>
          <foreignObject x="0" y="0" width="100" height="100">
            <img src="image.png" />
          </foreignObject>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('foreignObject');
      expect(result.layers).toHaveLength(1); // Only rect imported
    });

    it('should detect multiple foreignObject elements with plural message', () => {
      const svg = `
        <svg width="100" height="100">
          <rect x="10" y="10" width="30" height="30"/>
          <foreignObject x="0" y="0" width="50" height="50">
            <div>Content 1</div>
          </foreignObject>
          <foreignObject x="50" y="50" width="50" height="50">
            <div>Content 2</div>
          </foreignObject>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('2 foreignObject elements');
    });

    it('should not show warnings for pure vector SVGs', () => {
      const svg = `
        <svg width="100" height="100">
          <rect x="10" y="10" width="30" height="30"/>
          <circle cx="50" cy="50" r="20"/>
          <path d="M10 10 L50 50"/>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeUndefined();
      expect(result.layers).toHaveLength(3); // 3 shapes (rect, circle, path)
    });

    it('should handle SVG with both images and foreignObject', () => {
      const svg = `
        <svg width="100" height="100">
          <rect x="10" y="10" width="30" height="30"/>
          <image href="photo.png" x="0" y="0" width="50" height="50"/>
          <foreignObject x="50" y="50" width="50" height="50">
            <div>Content</div>
          </foreignObject>
        </svg>
      `;

      const result = parseSVG(svg);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBe(2);
      expect(result.warnings?.[0]).toContain('raster image');
      expect(result.warnings?.[1]).toContain('foreignObject');
      expect(result.layers).toHaveLength(1); // Only rect imported
    });
  });
});
