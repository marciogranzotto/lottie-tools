# Contributing to Lottie to GIF Converter

Thank you for your interest in contributing to this project! We welcome contributions of all kinds.

## Code of Conduct

This project aims to foster an open and welcoming environment. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:

- A clear title and description
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots if applicable
- Your environment (OS, Node.js version, etc.)

### Suggesting Features

Feature requests are welcome! Please:

- Check if the feature has already been requested
- Clearly describe the feature and its use case
- Explain why it would be beneficial

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/lottie-tools.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clear, commented code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

4. **Run tests**
   ```bash
   npm test
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Add: Brief description of your changes"
   ```

   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates to existing features
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes
   - `Test:` for test additions/changes

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure all tests pass

## Development Setup

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/marciorodrigues/lottie-tools.git
cd lottie-tools

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Project Structure

```
lottie-tools/
├── src/                    # Source code
│   ├── cli.ts             # CLI interface
│   ├── converter.ts       # Main orchestrator
│   ├── lottie-parser.ts   # Lottie JSON parser
│   ├── renderer.ts        # Frame renderer
│   ├── gif-encoder.ts     # GIF encoder
│   └── types/             # TypeScript type definitions
├── tests/                  # Tests
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── examples/               # Example Lottie files
└── bin/                    # Executable scripts
```

### Development Workflow

```bash
# Watch mode for development
npm run dev

# Run tests in watch mode
npm test -- --watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Generate coverage report
npm run coverage
```

## Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types for all functions and interfaces
- Avoid using `any` type when possible
- Use JSDoc comments for public APIs

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Use async/await over promises

### Testing

- Write tests for all new features
- Aim for >80% code coverage
- Include both unit and integration tests
- Test edge cases and error handling

Example test structure:

```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include code examples where helpful
- Update PLAN.md for significant changes

## Testing Checklist

Before submitting a PR, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code coverage is maintained or improved
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Examples work as expected
- [ ] No console errors or warnings

## Areas for Contribution

We welcome contributions in these areas:

### High Priority

- [ ] Additional unit tests for edge cases
- [ ] Performance optimizations
- [ ] Memory usage improvements
- [ ] Better error messages

### Medium Priority

- [ ] Additional CLI options
- [ ] Batch processing support
- [ ] More output formats
- [ ] Configuration file support

### Low Priority

- [ ] GUI/Web interface
- [ ] Preview mode
- [ ] Animation editing features
- [ ] Lottie file optimization

## Questions?

If you have questions about contributing:

- Check existing issues and discussions
- Create a new discussion on GitHub
- Reach out to the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Lottie to GIF Converter! 🎉
