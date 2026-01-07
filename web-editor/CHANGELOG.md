# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-07

### Added
- **SVG Group Rendering Support**: SVG files with `<g>` (group) elements now render correctly on the canvas
  - Recursive rendering function handles nested groups with proper transform composition
  - Groups are now selectable and support hit testing
  - Opacity correctly compounds for nested elements
  - Fixes rendering issues with complex SVGs like grouped diagrams

- **Raster Image Detection & Warnings**: Users are now notified when SVG files contain unsupported elements
  - Detects `<image>` elements (embedded raster images like PNG, JPG)
  - Detects `<foreignObject>` elements (HTML content in SVGs)
  - Displays clear toast warnings explaining that only vector graphics are supported
  - Warning messages show count of detected elements with proper singular/plural grammar
  - Comprehensive test coverage for all detection scenarios

### Changed
- Canvas rendering refactored to use recursive `renderElement()` function for all element types
- Hit testing updated to handle groups recursively with proper coordinate transformations
- Success toast now appears before warning toasts for better UX

### Technical Details
- Added `warnings` field to `SVGParseResult` interface
- Added `detectUnsupportedElements()` function to SVG parser
- Added `checkGroupHit()` helper for recursive group hit testing
- Import types: `GroupElement` and `AnyElement` now used in Canvas component
- All 449 tests passing with new test coverage for raster detection

## [0.1.0] - Initial Release

### Added
- Web-based Lottie animation editor
- SVG import support (vector elements only)
- Lottie JSON import/export
- Canvas rendering with transform controls
- Timeline with keyframe animation
- Layer management panel
- Property editor for shapes
- Support for basic SVG elements: rect, circle, ellipse, path, polygon, polyline
