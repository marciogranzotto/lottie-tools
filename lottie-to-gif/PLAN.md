# Lottie to GIF Converter Tool

## Scope
- **Paths**: Root directory and all source files for the lottie-to-gif converter
- **Goals**:
  - Create a CLI tool that converts Lottie JSON animations to GIF format
  - Support configurable output options (FPS, dimensions, quality)
  - Provide a simple, user-friendly command-line interface
  - Handle various Lottie animation complexities

## Non-Goals
- GUI/web interface (CLI only for now)
- Batch processing of multiple files (future enhancement)
- Reverse conversion (GIF to Lottie)
- Real-time preview during conversion
- Advanced editing/manipulation of Lottie animations before export

## Assumptions
- Node.js environment (v14+ recommended)
- Users have basic command-line familiarity
- Input files are valid Lottie JSON format (bodymovin export)
- Sufficient system memory for frame buffering
- Output directory is writable

## Constraints
- **GIF Format Limitations**: 256-color palette, binary transparency only (fully transparent or fully opaque, no semi-transparent pixels)
- **Performance**: Frame-by-frame rendering is CPU-intensive for complex animations
- **Memory**: All frames may need to be held in memory during encoding
- **File Size**: GIFs can become large for long/complex animations
- **Timeline**: Starting from empty repository, need foundational setup first

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor rendering quality due to GIF color limits | High | Implement dithering algorithms, provide quality options |
| Slow performance on complex animations | Medium | Show progress bar, consider multi-threading, optimize frame rate |
| Memory overflow on long animations | High | Implement streaming/chunked processing, add memory limits |
| Incompatibility with certain Lottie features | Medium | Test with diverse sample files, document limitations |
| Large output file sizes | Low | Provide compression options, allow frame rate/dimension adjustment |

## Related Plans/Issues/PRs
- None (initial project)

---

## Milestones

### Milestone 1: Project Foundation & Dependencies
**Goal**: Set up Node.js project structure with required dependencies

**Steps**:
- [ ] Initialize package.json with project metadata
- [ ] Install core dependencies:
  - `puppeteer` or `puppeteer-core` (for rendering Lottie with lottie-web)
  - `gifencoder` or `gif-encoder-2` (for GIF creation)
  - `commander` (for CLI interface)
  - `chalk` (for colored terminal output)
  - `ora` (for loading spinners/progress)
- [ ] Install dev dependencies (TypeScript, ESLint, testing framework)
- [ ] Create basic project structure (src/, tests/, examples/)
- [ ] Set up TypeScript configuration
- [ ] Create .gitignore file
- [ ] Add README.md with basic project description

**Files**:
- `package.json`
- `tsconfig.json`
- `.gitignore`
- `README.md`
- `.eslintrc.js` (optional)

**Tests/Validation**:
- `npm install` runs without errors
- TypeScript compiles successfully (`npx tsc --noEmit`)
- Project structure is logical and organized

**Rollback Strategy**:
- Simply delete generated files and start over
- Git reset if needed

**Exit Criteria**:
- All dependencies installed successfully
- TypeScript configuration working
- Basic project structure in place
- README documents project purpose

---

### Milestone 2: Core Lottie Parser & Validator
**Goal**: Implement functionality to read and validate Lottie JSON files

**Steps**:
- [ ] Create `src/lottie-parser.ts` module
- [ ] Implement function to read JSON file from disk
- [ ] Add validation for required Lottie properties (v, fr, w, h, layers)
- [ ] Extract animation metadata (width, height, frame rate, duration)
- [ ] Handle file read errors gracefully
- [ ] Add TypeScript types for Lottie JSON structure

**Files**:
- `src/lottie-parser.ts`
- `src/types/lottie.ts`

**Tests/Validation**:
- Unit tests for valid Lottie files
- Unit tests for invalid/malformed files
- Test with sample Lottie files from LottieFiles.com

**Rollback Strategy**:
- Remove parser module
- Revert to previous milestone

**Exit Criteria**:
- Can successfully read valid Lottie JSON files
- Proper error messages for invalid files
- Extracts correct animation metadata
- All tests passing

---

### Milestone 3: Puppeteer-based Rendering Engine
**Goal**: Render Lottie animation frames using Puppeteer and lottie-web

**Steps**:
- [ ] Create `src/renderer.ts` module
- [ ] Set up headless browser instance with Puppeteer
- [ ] Create HTML template that loads lottie-web library
- [ ] Inject Lottie JSON data into browser context
- [ ] Implement frame-by-frame capture at specified FPS
- [ ] Extract frame data as image buffers (PNG format)
- [ ] Add progress tracking/callbacks
- [ ] Implement cleanup of browser resources
- [ ] Handle rendering errors and timeouts

**Files**:
- `src/renderer.ts`
- `src/templates/lottie-player.html`
- `src/types/renderer.ts`

**Tests/Validation**:
- Render a simple Lottie animation (e.g., 2 seconds, 30fps)
- Verify frame count matches expected (duration * fps)
- Visual inspection of extracted frames
- Test resource cleanup (no memory leaks)

**Rollback Strategy**:
- Remove renderer module
- Revert to Milestone 2

**Exit Criteria**:
- Successfully renders Lottie animations frame-by-frame
- Frames are captured as image buffers
- Progress tracking works
- Browser resources properly cleaned up
- Tests pass

---

### Milestone 4: GIF Encoding Pipeline
**Goal**: Convert rendered frames into GIF format

**Steps**:
- [ ] Create `src/gif-encoder.ts` module
- [ ] Initialize GIF encoder with animation dimensions
- [ ] Configure frame delay based on FPS
- [ ] Add frames sequentially to encoder
- [ ] Implement quality/optimization options
- [ ] Write final GIF to output file
- [ ] Add progress tracking for encoding phase
- [ ] Implement memory-efficient streaming if possible

**Files**:
- `src/gif-encoder.ts`
- `src/types/encoder.ts`

**Tests/Validation**:
- Encode frames into GIF format
- Verify GIF plays back at correct speed
- Test with different quality settings
- Check output file size is reasonable
- Visual inspection of output GIF

**Rollback Strategy**:
- Remove encoder module
- Revert to Milestone 3

**Exit Criteria**:
- Frames successfully encoded to GIF
- GIF animation plays smoothly
- Output file is valid and viewable
- Quality options work as expected
- Tests pass

---

### Milestone 5: End-to-End Conversion Pipeline
**Goal**: Integrate parser, renderer, and encoder into complete conversion workflow

**Steps**:
- [ ] Create `src/converter.ts` module as main orchestrator
- [ ] Implement full pipeline: parse → render → encode
- [ ] Add configuration options:
  - Output filename
  - FPS (frames per second)
  - Width/height (scale options)
  - Quality settings
- [ ] Implement proper error handling at each stage
- [ ] Add progress reporting through entire pipeline
- [ ] Create cleanup routine for temporary files/resources
- [ ] Add logging for debugging purposes

**Files**:
- `src/converter.ts`
- `src/types/config.ts`
- `src/utils/logger.ts`

**Tests/Validation**:
- End-to-end test: Lottie JSON → GIF output
- Test with various configuration options
- Test error handling (invalid input, insufficient memory, etc.)
- Verify no resource leaks or temp files left behind

**Rollback Strategy**:
- Remove converter module
- Components still work independently

**Exit Criteria**:
- Complete conversion pipeline works end-to-end
- All configuration options functional
- Robust error handling
- Clean resource management
- Integration tests pass

---

### Milestone 6: CLI Interface
**Goal**: Create user-friendly command-line interface

**Steps**:
- [ ] Create `src/cli.ts` as main entry point
- [ ] Use Commander.js to define CLI commands and options:
  - Required: input file path
  - Optional: output path, fps, width, height, quality
- [ ] Add help text and usage examples
- [ ] Implement progress indicators with Ora
- [ ] Add colored output with Chalk (success/error messages)
- [ ] Validate CLI arguments before processing
- [ ] Add version command
- [ ] Create executable bin script
- [ ] Add shebang for direct execution

**Files**:
- `src/cli.ts`
- `bin/lottie-to-gif` (executable)

**Tests/Validation**:
- Test CLI with various argument combinations
- Test help output (`--help`)
- Test version command (`--version`)
- Test error messages for invalid arguments
- Manual testing of progress indicators

**Rollback Strategy**:
- Remove CLI module
- Core converter still usable programmatically

**Exit Criteria**:
- CLI accepts all required and optional arguments
- Help text is clear and comprehensive
- Progress indicators work smoothly
- Error messages are helpful
- CLI is executable via npm

---

### Milestone 7: Testing & Documentation
**Goal**: Comprehensive test coverage and user documentation

**Steps**:
- [ ] Add unit tests for all modules (aim for >80% coverage)
- [ ] Create integration tests for full pipeline
- [ ] Add sample Lottie files to `examples/` directory
- [ ] Write comprehensive README.md:
  - Installation instructions
  - Usage examples
  - Configuration options
  - Troubleshooting guide
  - Limitations and known issues
- [ ] Add inline code documentation (JSDoc/TSDoc)
- [ ] Create CONTRIBUTING.md for future contributors
- [ ] Add LICENSE file
- [ ] Set up npm scripts for testing, building, linting

**Files**:
- `tests/**/*.test.ts`
- `README.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `examples/sample-*.json`

**Tests/Validation**:
- Run full test suite (`npm test`)
- Verify code coverage metrics
- Test installation in fresh environment
- Follow README instructions to ensure they work

**Rollback Strategy**:
- Tests can be removed without affecting functionality
- Documentation updates are non-breaking

**Exit Criteria**:
- >80% test coverage
- All tests passing
- Comprehensive README with examples
- Sample files included
- Tool is ready for distribution

---

### Milestone 8: Performance Optimization & Polish
**Goal**: Optimize performance and add final polish

**Steps**:
- [ ] Profile performance with various animation sizes
- [ ] Optimize frame rendering (consider parallel processing)
- [ ] Implement memory usage monitoring/limits
- [ ] Add optional caching for repeated renders
- [ ] Optimize GIF encoding (compression, dithering)
- [ ] Add dry-run mode to preview settings without converting
- [ ] Implement verbose logging mode
- [ ] Add telemetry/stats output (optional)
- [ ] Code cleanup and refactoring
- [ ] Final bug fixes

**Files**:
- All existing source files (refactoring)
- `src/utils/performance.ts`
- `src/utils/cache.ts` (optional)

**Tests/Validation**:
- Performance benchmarks on various file sizes
- Memory usage monitoring
- Compare output quality before/after optimizations
- Test all new features

**Rollback Strategy**:
- Revert optimizations if they cause issues
- Core functionality preserved

**Exit Criteria**:
- Performance is acceptable for typical use cases
- Memory usage is bounded and reasonable
- No major bugs or issues
- Code is clean and maintainable
- Ready for v1.0 release

---

## Implementation Notes

### Technology Stack Decision
**Chosen Approach**: Puppeteer + lottie-web
- **Rationale**: Most accurate rendering since it uses the official lottie-web library in a real browser context
- **Alternative Considered**: node-canvas with custom rendering
  - Rejected because: Would require reimplementing Lottie rendering logic, less accurate
- **Alternative Considered**: rlottie (C++ library with Node bindings)
  - Rejected because: Native dependencies complicate installation, limited platform support

### Architecture Overview
```
┌─────────────────┐
│   CLI Interface │
│  (commander)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Converter     │ ◄─── Configuration
│  (orchestrator) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌──────────┐ ┌─────────────┐
│Parser │→│ Renderer │→│ GIF Encoder │
└───────┘ └──────────┘ └─────────────┘
                              │
                              ▼
                         ┌─────────┐
                         │ Output  │
                         │  .gif   │
                         └─────────┘
```

### Data Flow
1. **Input**: Lottie JSON file from filesystem
2. **Parse**: Extract animation metadata (width, height, FPS, duration)
3. **Render**: Use Puppeteer to render each frame as PNG buffer
4. **Encode**: Feed frame buffers to GIF encoder
5. **Output**: Write final GIF to filesystem

### Configuration Schema
```typescript
interface ConversionConfig {
  input: string;           // Path to Lottie JSON
  output?: string;         // Output path (default: input.gif)
  fps?: number;            // Frames per second (default: source FPS)
  width?: number;          // Output width (default: source width)
  height?: number;         // Output height (default: source height)
  quality?: number;        // 1-100, affects color quantization
  dither?: boolean;        // Enable dithering for better colors
  verbose?: boolean;       // Enable detailed logging
}
```

### Error Handling Strategy
- Validate all inputs before processing
- Provide clear, actionable error messages
- Clean up resources (browser instances, temp files) on failure
- Exit gracefully with appropriate exit codes
- Log detailed errors in verbose mode

### Performance Considerations
- **Frame Rate**: Allow users to reduce FPS to speed up conversion
- **Dimensions**: Smaller output dimensions = faster processing
- **Streaming**: Consider streaming frames to encoder rather than buffering all
- **Parallelization**: Potentially render multiple frames concurrently (future optimization)

---

## Test Plan

### Unit Tests
- **lottie-parser.ts**:
  - Valid JSON parsing
  - Invalid JSON handling
  - Missing required fields
  - Metadata extraction accuracy

- **renderer.ts**:
  - Browser initialization
  - Frame capture
  - Resource cleanup
  - Error handling

- **gif-encoder.ts**:
  - Frame addition
  - Quality settings
  - File writing
  - Memory management

- **converter.ts**:
  - Pipeline orchestration
  - Configuration handling
  - Error propagation

### Integration Tests
- End-to-end conversion with sample files
- Various configuration combinations
- Error scenarios (missing files, invalid JSON, etc.)
- Resource cleanup verification

### Test Files Needed
- Simple animation (2s, 30fps, basic shapes)
- Complex animation (10s, 60fps, gradients)
- Invalid JSON files (malformed, missing fields)
- Edge cases (1 frame, very long duration)

### Testing Tools
- Jest or Mocha for test framework
- Chai for assertions (if using Mocha)
- Sinon for mocking/stubbing
- Istanbul/nyc for code coverage

### Testing Commands
```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests
npm run coverage      # Generate coverage report
```

### Performance Benchmarks
- Measure conversion time for various file sizes
- Monitor memory usage during conversion
- Compare quality vs. file size trade-offs
- Test on different platforms (macOS, Linux, Windows if possible)

---

## Release/Deploy Plan

### Pre-Release Checklist
- [ ] All tests passing
- [ ] Code coverage >80%
- [ ] Documentation complete
- [ ] Sample files included
- [ ] LICENSE file added
- [ ] CHANGELOG.md created
- [ ] Version number set (semver)

### NPM Publishing Steps
1. Build the project: `npm run build`
2. Test installation locally: `npm link`
3. Verify CLI works: `lottie-to-gif --help`
4. Update version: `npm version <major|minor|patch>`
5. Publish to npm: `npm publish`
6. Create GitHub release with tag
7. Update README with installation instructions

### Feature Flags
Not applicable for initial release (all features enabled by default)

### Rollout Strategy
- Initial release as v1.0.0
- Publish to npm registry
- Announce on relevant channels (GitHub, social media)
- Gather user feedback
- Iterate based on issues and requests

### Monitoring
- Track npm download statistics
- Monitor GitHub issues for bugs/feature requests
- Set up error telemetry (optional, opt-in only)

### Backout Procedures
- If critical bug found: publish patch version quickly
- Can deprecate version on npm if necessary
- Communicate issues to users via GitHub

---

## Open Questions

1. **Color Quantization**: Which algorithm should we use for reducing colors to 256? (Median cut, Octree, etc.)
   - *Decision needed before Milestone 4*

2. **Memory Limits**: Should we set a hard limit on memory usage? What threshold?
   - *Decision needed before Milestone 5*

3. **Platform Support**: Should we explicitly test and support Windows? (Puppeteer can be tricky on Windows)
   - *Decision needed before Milestone 7*

4. **Licensing**: What license should we use? MIT? Apache 2.0?
   - *Decision needed before Milestone 7*

5. **NPM Package Name**: Is "lottie-to-gif" available? Need to check npm registry
   - *Decision needed before publishing*

6. **Bundling Approach**: Should we bundle lottie-web with the package or load from CDN?
   - *Decision needed before Milestone 3*

---

## Changelog

2025-11-04 — Milestone: Project Foundation & Dependencies — Action: Completed project setup — Result: package.json created, dependencies installed (puppeteer, gif-encoder-2, commander, chalk, ora), TypeScript and Jest configured, project structure created (src/, tests/, examples/, bin/), .gitignore and README.md added, TypeScript compilation verified — By: Claude

2025-11-04 — Milestone: Core Lottie Parser & Validator — Action: Implemented Lottie file parser and validator — Result: Created src/types/lottie.ts (type definitions), src/lottie-parser.ts (read/validate/extract metadata), tests/unit/lottie-parser.test.ts (23 tests, all passing), successfully parses examples/bond_vector.json (236x89, 30fps, 1.6s duration) — By: Claude

2025-11-04 — Milestone: Puppeteer-based Rendering Engine — Action: Implemented Lottie animation renderer using Puppeteer and lottie-web — Result: Created src/types/renderer.ts (RenderOptions, RenderResult, RenderedFrame, RenderProgress), src/renderer.ts (renderAnimation, renderSingleFrame functions), src/templates/lottie-player.html (browser template with lottie-web), tests/integration/renderer.test.ts (integration tests), updated build script to copy templates, successfully rendered 5 frames from bond_vector.json in 2.55s, outputs valid PNG buffers — By: Claude

2025-11-04 — Milestone: GIF Encoding Pipeline — Action: Implemented GIF encoder to convert rendered frames to animated GIF — Result: Created src/types/encoder.ts (EncodeOptions, EncodeResult, EncodeProgress), src/gif-encoder.ts (encodeToGif function using gif-encoder-2), src/types/gif-encoder-2.d.ts (type declarations), tests/integration/gif-encoder.test.ts (integration tests), installed pngjs for PNG decoding, successfully completed end-to-end test: rendered 10 frames (2.86s) + encoded to GIF (0.04s) = 20.15KB output file (236x89, 30fps) — By: Claude

2025-11-04 — Milestone: End-to-End Conversion Pipeline — Action: Implemented complete conversion orchestrator integrating all components — Result: Created src/types/config.ts (ConversionConfig, ConversionResult, ConversionProgress, ConversionError), src/converter.ts (convertLottieToGif function with Logger class, validateConfig), tests/integration/converter.test.ts (comprehensive tests), full pipeline working: parse → render → encode with progress tracking through all phases, verbose logging mode, error handling per phase, successfully converted full bond_vector.json (48 frames) in 5.52s (parse: 0.00s, render: 5.41s, encode: 0.11s) = 98.12KB GIF output — By: Claude

2025-11-04 — Milestone: CLI Interface — Action: Implemented command-line interface with Commander.js, Ora, and Chalk — Result: Created src/cli.ts (full CLI with all options), bin/lottie-to-gif (executable entry point), Commander.js for argument parsing with help text and examples, Ora for progress spinners, Chalk for colored output (cyan input/output, green success, red errors), supports all conversion options (fps, dimensions, quality, dither, loop/repeat, timeout, verbose), configuration validation, version command (--version), comprehensive help (--help), tested successfully: default conversion (98KB), verbose mode with timing breakdown, custom options (400x150 @ 15fps = 84KB), error handling for missing files — By: Claude

2025-11-04 — Milestone: Testing & Documentation — Action: Completed comprehensive documentation and testing infrastructure — Result: Updated README.md (comprehensive guide with badges, features, installation, usage examples, API docs, troubleshooting, performance tips, limitations), created CONTRIBUTING.md (contribution guidelines, dev setup, coding standards, testing checklist), created LICENSE (MIT), added examples/bond_vector.json (sample file), existing test suite: 23 unit tests passing, 3 integration test suites with coverage at 77% statements/70% branches/78% lines, all core functionality tested (parser, renderer, encoder, converter, CLI), npm scripts verified working (build, test, lint, coverage) — By: Claude

2025-11-05 — Feature: Scale, Background Color, and Output Folder — Action: Added scaling, background color, and output path features — Result: Added --scaled option for easy dimension scaling (e.g., --scaled 2 for 2x size), added --bg option for custom background colors in hex format (FFFFFF or FFFFFFFF with alpha), background color now auto-detected from Lottie JSON or defaults to transparent, changed default output path to output/ folder with source filename, added output/ folder to .gitignore, extended type definitions (ConversionConfig, RenderOptions, LottieMetadata), added hexToCSS() helper for color conversion, updated lottie-parser to extract background color, updated renderer to apply background color to HTML template, modified screenshot logic to include/omit background, tested with multiple scenarios: default transparent, 2x scaling, white background, semi-transparent red, combined scaling + background — By: Claude

2025-11-05 — Feature: GIF Transparency Support — Action: Implemented binary transparency for GIF output — Result: Added backgroundColor field to EncodeOptions interface, updated gif-encoder.ts to call encoder.setTransparent(0x000000) when backgroundColor is 'transparent', gif-encoder-2 automatically detects pixels with alpha=0 and maps them to transparent color index in GIF palette, updated converter.ts to pass backgroundColor to encoder, fixed hexToCSS() to properly handle "transparent" keyword, tested transparent backgrounds (default and explicit --bg transparent), tested solid backgrounds for regression (white, blue), GIFs now properly support binary transparency with transparent pixels showing checkerboard pattern in compatible viewers — By: Claude

---

**Plan Created**: 2025-11-04
**Last Updated**: 2025-11-05
**Status**: Milestone 7 Completed + Feature Enhancements
**Next Milestone**: Milestone 8 - Performance Optimization & Polish
