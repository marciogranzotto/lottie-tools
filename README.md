# Lottie Open Studio

An open-source web-based animation editor for creating and editing Lottie animations. Import SVGs, create keyframe animations, edit existing Lottie files, and export to JSON format.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org)

## 🎨 Features

### Current Status: 🚧 In Development

**Lottie Open Studio** is currently under active development. The web editor will provide:

- 📁 **Import & Edit** - Import SVG files or existing Lottie JSON animations
- ⌛ **Timeline Editor** - Visual timeline with keyframe manipulation
- 🎬 **Animation Properties** - Animate position, scale, rotation, opacity, colors, and more
- 👁️ **Live Preview** - Real-time preview using lottie-web
- 💾 **Export to Lottie** - Export animations as Lottie JSON
- 🔄 **Round-trip Editing** - Import existing Lottie files, edit, and re-export
- 💻 **Browser-based** - No installation required, works in modern browsers

See [PLAN.web-editor.md](PLAN.web-editor.md) for the complete development roadmap.

## 📦 Project Structure

This repository contains two complementary tools for working with Lottie animations:

### 1. **Lottie Open Studio** (Web Editor) - Main Project
*Coming Soon* - A browser-based animation editor for creating and editing Lottie animations.

**Location**: `web-editor/`
**Status**: 🚧 In Development
**Technology**: React + TypeScript + Vite + Zustand

### 2. **Lottie to GIF Converter** (CLI Tool)
✅ Production Ready - Convert Lottie JSON animations to animated GIF files.

**Location**: [`lottie-to-gif/`](lottie-to-gif/)
**Status**: ✅ Stable
**Documentation**: [lottie-to-gif/README.md](lottie-to-gif/README.md)

```bash
# Quick example
cd lottie-to-gif
npm install
npm run build
node bin/lottie-to-gif examples/bond_vector.json
```

## 🚀 Getting Started

### Web Editor (Coming Soon)

```bash
# Clone the repository
git clone https://github.com/marciorodrigues/lottie-tools.git
cd lottie-tools/web-editor

# Install dependencies
npm install

# Start development server
npm run dev
```

### CLI Converter (Available Now)

```bash
cd lottie-to-gif
npm install
npm run build

# Convert a Lottie animation to GIF
npx lottie-to-gif animation.json
```

See [lottie-to-gif/README.md](lottie-to-gif/README.md) for full CLI documentation.

## 📋 Development Roadmap

### MVP (v1.0) - Lottie Open Studio
- [x] Project planning and architecture
- [ ] Project setup (React + Vite + TypeScript)
- [ ] SVG import and parsing
- [ ] Timeline UI and playback
- [ ] Keyframe creation and editing
- [ ] Multi-property animation system
- [ ] Lottie JSON export
- [ ] Lottie JSON import and editing
- [ ] Preview integration with lottie-web
- [ ] Project save/load
- [ ] UI/UX polish and documentation

### Post-MVP Features
- [ ] Text layer support (v1.1)
- [ ] Gradient support (v1.2)
- [ ] Advanced features: path morphing, masks, expressions (v2.0+)

See [PLAN.web-editor.md](PLAN.web-editor.md) for detailed milestone breakdown.

## 🛠️ Technology Stack

### Lottie Open Studio (Web Editor)
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: Zustand
- **Animation Engine**: lottie-web
- **Timeline**: Custom or existing library (TBD)

### Lottie to GIF (CLI Tool)
- **Language**: TypeScript
- **Runtime**: Node.js
- **Rendering**: Puppeteer + lottie-web
- **Encoding**: gif-encoder-2

## 📚 Documentation

- **Web Editor Plan**: [PLAN.web-editor.md](PLAN.web-editor.md) - Comprehensive development plan
- **CLI Tool Plan**: [lottie-to-gif/PLAN.md](lottie-to-gif/PLAN.md) - CLI implementation details
- **CLI Tool README**: [lottie-to-gif/README.md](lottie-to-gif/README.md) - Usage documentation

## 🤝 Contributing

Contributions are welcome! This project is in active development.

### For Web Editor Development
1. Check [PLAN.web-editor.md](PLAN.web-editor.md) for current milestone
2. Pick an unassigned task or create an issue
3. Fork the repository
4. Create a feature branch
5. Make your changes with tests
6. Submit a pull request

### For CLI Tool
See [lottie-to-gif/CONTRIBUTING.md](lottie-to-gif/CONTRIBUTING.md)

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [lottie-web](https://github.com/airbnb/lottie-web) - Official Lottie animation library
- [Puppeteer](https://pptr.dev/) - Headless Chrome automation
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Zustand](https://github.com/pmndrs/zustand) - State management

## 📞 Support

- 🐛 [Issue Tracker](https://github.com/marciorodrigues/lottie-tools/issues)
- 💬 [Discussions](https://github.com/marciorodrigues/lottie-tools/discussions)
- 📧 Questions? Open an issue!

## 🗺️ Project Vision

**Lottie Open Studio** aims to be a powerful, open-source alternative for creating and editing Lottie animations directly in the browser. By combining a user-friendly web editor with a robust CLI converter, we're building a complete toolkit for working with Lottie animations.

**Why Lottie?**
- Vector animations that scale without quality loss
- Small file sizes compared to GIF/video
- Interactive and programmable
- Cross-platform (web, iOS, Android, React Native)

---

Made with ❤️ using [Claude Code](https://claude.com/claude-code)
