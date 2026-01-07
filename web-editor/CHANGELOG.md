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

- **Group Expand/Collapse in Layers Panel**: Groups in the layers panel can now be expanded and collapsed
  - Each group element gets its own layer with child elements as separate layers
  - Expand/collapse buttons (▶/▼) appear for groups with children
  - Child layers are hidden when parent group is collapsed
  - SVG groups are now "flattened" into separate layers with proper `parentId` relationships
  - Allows users to select and edit individual shapes inside groups
  - Parent groups automatically expand when child layers are selected
  - Selected layers automatically scroll into view in the layers panel

- **Raster Image Detection & Warnings**: Users are now notified when SVG files contain unsupported elements
  - Detects `<image>` elements (embedded raster images like PNG, JPG)
  - Detects `<foreignObject>` elements (HTML content in SVGs)
  - Displays clear toast warnings explaining that only vector graphics are supported
  - Warning messages show count of detected elements with proper singular/plural grammar
  - Comprehensive test coverage for all detection scenarios

### Changed
- Canvas rendering refactored to use recursive `renderElement()` function for all element types
- Hit testing updated to handle groups recursively with proper coordinate transformations
- Double-click selection now correctly selects child elements instead of parent groups
- Child element hit testing uses canvas transformation matrix for accurate coordinate mapping
- **Smart selection**: Double-click now uses "best match" scoring to select the most relevant element
  - Prefers smaller elements over larger ones when overlapping
  - Prefers elements closer to the click point
  - Solves the issue of selecting small shapes inside large containers
- Selection behavior improved: single-click selects groups, double-click selects individual children
- Success toast now appears before warning toasts for better UX
- SVG parser now flattens group hierarchies into separate layer objects for LayersPanel
- Groups maintain their `children` array for Canvas rendering while also creating child layers for LayersPanel

### Technical Details
- Added `warnings` field to `SVGParseResult` interface
- Added `detectUnsupportedElements()` function to SVG parser
- Added `checkGroupHit()` helper for recursive group hit testing
- Added `flattenElementToLayers()` function to create layer hierarchy from nested elements
- Added `getElementArea()` function to calculate bounding box area for all element types
- Added `getDistanceToCenter()` function to calculate distance from click to element center
- Added smart selection scoring algorithm with formula: `distance * 2 + sqrt(area) / 100`
- Added `expandedGroupIds` state and `toggleGroupExpanded` action to store
- Updated `selectLayer` action to auto-expand all parent groups when selecting child layers
- Import types: `GroupElement` and `AnyElement` now used in Canvas component
- LayersPanel now filters visible layers based on parent expansion state
- LayersPanel uses refs and `scrollIntoView()` for auto-scrolling to selected layers
- Double-click handler collects all hit candidates and selects the best match by score
- Double-click handler uses canvas transformation matrix (DOMMatrix) for precise hit testing
- Double-click handler properly applies parent transforms before checking child elements
- All 449 tests passing with new test coverage for raster detection and group flattening

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
