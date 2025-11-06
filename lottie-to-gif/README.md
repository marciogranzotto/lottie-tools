# Lottie to GIF Converter

A powerful command-line tool to convert Lottie JSON animations to animated GIF files with high-quality output.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/marciorodrigues/lottie-tools)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org)

## Features

- 🎬 **Accurate Rendering** - Uses official lottie-web library in headless browser for pixel-perfect output
- ⚡ **Fast Processing** - Efficient frame-by-frame rendering with Puppeteer
- 🎨 **Quality Control** - Configurable quality settings and optional dithering
- 📏 **Flexible Output** - Custom dimensions, scaling, frame rate, and loop settings
- 🌈 **Background Control** - Transparent backgrounds (binary transparency) or custom colors with alpha support
- 📊 **Progress Tracking** - Beautiful progress indicators and verbose logging
- 🛠️ **Developer Friendly** - Comprehensive TypeScript API and CLI

## Installation

### Global Installation

```bash
npm install -g lottie-to-gif
```

### Local Development

```bash
git clone https://github.com/marciorodrigues/lottie-tools.git
cd lottie-tools/lottie-to-gif
npm install
npm run build
```

### Requirements

- Node.js >= 14.0.0
- Chromium (automatically installed by Puppeteer)

## Quick Start

```bash
# Basic conversion
lottie-to-gif animation.json

# With custom output path
lottie-to-gif animation.json -o my-animation.gif

# Custom dimensions and frame rate
lottie-to-gif animation.json --width 800 --height 600 --fps 30

# High quality with dithering
lottie-to-gif animation.json --quality 95 --dither

# Verbose mode with detailed logging
lottie-to-gif animation.json --verbose
```

## CLI Usage

### Command Syntax

```bash
lottie-to-gif <input> [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output GIF file path | `output/<filename>.gif` |
| `--fps <number>` | Frames per second | Source FPS |
| `--width <pixels>` | Output width in pixels | Source width |
| `--height <pixels>` | Output height in pixels | Source height |
| `--scaled <number>` | Scale multiplier (e.g., 2 = 2x size) | - |
| `--bg <color>` | Background color (FFFFFF or FFFFFFFF with alpha, or 'transparent') | Transparent |
| `--quality <number>` | Quality level (1-100) | 80 |
| `--dither` | Enable dithering for better colors | false |
| `--no-loop` | Disable looping | Loop forever |
| `--repeat <times>` | Repeat count (0 = no repeat, n = repeat n times) | -1 (loop) |
| `--timeout <ms>` | Rendering timeout in milliseconds | 60000 |
| `--verbose` | Enable verbose logging | false |
| `--dry-run` | Preview conversion settings without converting | false |
| `--no-progress` | Disable progress indicators | false |
| `-v, --version` | Output version number | - |
| `-h, --help` | Display help information | - |

### Examples

```bash
# Convert with default settings (transparent background)
lottie-to-gif animation.json

# Resize and adjust frame rate
lottie-to-gif animation.json --width 400 --height 300 --fps 24

# Scale to 2x size
lottie-to-gif animation.json --scaled 2

# White background
lottie-to-gif animation.json --bg FFFFFF

# Semi-transparent red background
lottie-to-gif animation.json --bg FF000080

# Explicit transparent background
lottie-to-gif animation.json --bg transparent

# High quality output with dithering
lottie-to-gif animation.json --quality 95 --dither

# No looping GIF
lottie-to-gif animation.json --no-loop

# Repeat 3 times then stop
lottie-to-gif animation.json --repeat 3

# Verbose mode for debugging
lottie-to-gif animation.json --verbose

# Preview conversion without actually converting (dry run)
lottie-to-gif animation.json --dry-run
lottie-to-gif animation.json --scaled 2 --bg FFFFFF --dry-run

# Custom timeout for complex animations
lottie-to-gif complex.json --timeout 120000
```

## Programmatic API

You can also use lottie-to-gif programmatically in your Node.js projects:

```typescript
import { convertLottieToGif } from 'lottie-to-gif';

async function convert() {
  const result = await convertLottieToGif({
    input: 'animation.json',
    output: 'output.gif',
    scaled: 2,                    // Scale to 2x size
    backgroundColor: 'FFFFFF',    // White background (or 'transparent')
    fps: 30,
    quality: 85,
    dither: true,
    verbose: true,
    dryRun: false,                // Set to true to preview without converting
    onProgress: (progress) => {
      console.log(`${progress.phase}: ${progress.percentage}%`);
    }
  });

  console.log(`Created ${result.outputPath}`);
  console.log(`File size: ${result.fileSize} bytes`);
  console.log(`Total time: ${result.totalTime}ms`);
}

convert();
```

### API Types

```typescript
interface ConversionConfig {
  input: string;                    // Required: Input Lottie JSON file path
  output?: string;                  // Optional: Output GIF path (default: output/<filename>.gif)
  fps?: number;                     // Optional: Frame rate
  width?: number;                   // Optional: Output width
  height?: number;                  // Optional: Output height
  scaled?: number;                  // Optional: Scale multiplier (e.g., 2 = 2x size)
  backgroundColor?: string;         // Optional: Background color (hex: FFFFFF/FFFFFFFF or 'transparent')
  quality?: number;                 // Optional: Quality (1-100)
  dither?: boolean;                 // Optional: Enable dithering
  repeat?: number;                  // Optional: Repeat count (-1 = loop, 0 = no repeat)
  timeout?: number;                 // Optional: Timeout in ms
  verbose?: boolean;                // Optional: Verbose logging
  dryRun?: boolean;                 // Optional: Preview settings without converting
  onProgress?: (progress) => void;  // Optional: Progress callback
}
```

## How It Works

1. **Parse** - Reads and validates the Lottie JSON file
2. **Render** - Uses Puppeteer and lottie-web to render each frame as PNG
3. **Encode** - Converts PNG frames to animated GIF using gif-encoder-2

```
┌─────────────┐
│  Lottie     │
│  JSON File  │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Parser    │  Validates JSON structure
└─────┬───────┘  Extracts metadata
      │
      ▼
┌─────────────┐
│  Renderer   │  Puppeteer + lottie-web
└─────┬───────┘  Frame-by-frame capture
      │
      ▼
┌─────────────┐
│   Encoder   │  GIF encoding with
└─────┬───────┘  color quantization
      │
      ▼
┌─────────────┐
│  GIF File   │
└─────────────┘
```

## Performance Tips

- **Preview first** - Use dry-run to check settings before processing
  ```bash
  lottie-to-gif animation.json --scaled 2 --dry-run
  ```

- **Lower frame rate** - Reduces file size and conversion time
  ```bash
  lottie-to-gif animation.json --fps 15
  ```

- **Reduce dimensions** - Smaller output = faster processing
  ```bash
  lottie-to-gif animation.json --width 400 --height 300
  ```

- **Adjust quality** - Lower quality = smaller file size
  ```bash
  lottie-to-gif animation.json --quality 70
  ```

- **Use dithering** - Better color representation in complex animations
  ```bash
  lottie-to-gif animation.json --dither
  ```

## Troubleshooting

### Puppeteer Installation Issues

If Puppeteer fails to install Chromium:

```bash
# Set custom Chromium path
export PUPPETEER_EXECUTABLE_PATH=/path/to/chromium

# Or skip Chromium download and use system Chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### Memory Issues

For large animations, increase Node.js memory:

```bash
NODE_OPTIONS="--max-old-space-size=4096" lottie-to-gif large-animation.json
```

### Timeout Errors

Increase timeout for complex animations:

```bash
lottie-to-gif complex.json --timeout 120000
```

### Color Issues

Enable dithering for better color representation:

```bash
lottie-to-gif animation.json --dither --quality 90
```

## Limitations

- **GIF Color Limit** - GIF format supports only 256 colors per frame. Complex gradients may not render perfectly.
- **File Size** - Long or high-resolution animations produce large GIF files.
- **Processing Time** - Complex animations with many frames take longer to render.
- **Transparency** - GIF only supports binary transparency (fully transparent or fully opaque).

## Development

### Setup

```bash
npm install
npm run build
```

### Available Scripts

```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Watch mode for development
npm test               # Run tests
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests
npm run coverage       # Generate coverage report
npm run lint           # Run ESLint
npm run lint:fix       # Fix linting issues
```

### Project Structure

```
lottie-to-gif/
├── src/
│   ├── cli.ts              # CLI interface
│   ├── converter.ts        # Main orchestrator
│   ├── lottie-parser.ts    # JSON parser & validator
│   ├── renderer.ts         # Puppeteer rendering
│   ├── gif-encoder.ts      # GIF encoding
│   ├── types/              # TypeScript types
│   ├── templates/          # HTML templates
│   └── utils/              # Utility functions
├── tests/
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── examples/               # Sample Lottie files
├── bin/                    # Executable entry point
└── dist/                   # Compiled output
```

**Note**: This tool is part of the Lottie Tools suite. See the [main README](../README.md) for information about the full project, including the Lottie Open Studio web editor.

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Run specific test file
npx jest tests/unit/lottie-parser.test.ts
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run tests and ensure they pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [lottie-web](https://github.com/airbnb/lottie-web) - Official Lottie animation library
- [Puppeteer](https://pptr.dev/) - Headless Chrome automation
- [gif-encoder-2](https://www.npmjs.com/package/gif-encoder-2) - High-quality GIF encoding
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Ora](https://github.com/sindresorhus/ora) - Progress spinners

## Support

- 📖 [Documentation](https://github.com/marciorodrigues/lottie-tools)
- 🐛 [Issue Tracker](https://github.com/marciorodrigues/lottie-tools/issues)
- 💬 [Discussions](https://github.com/marciorodrigues/lottie-tools/discussions)

## Related Projects

This CLI tool is part of the **Lottie Tools** suite:
- **Lottie Open Studio** - Web-based animation editor (in development) - [Learn more](../README.md)
- **Lottie to GIF** - CLI converter (this tool)

See [PLAN.md](PLAN.md) for the detailed implementation plan and future enhancements.

---

Made with ❤️ using [Claude Code](https://claude.com/claude-code)
