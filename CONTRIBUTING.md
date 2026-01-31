# Contributing to Moltbot Worker

Thank you for your interest in contributing to Moltbot Worker! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 22+
- npm (or yarn/pnpm)
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/moltworker.git
   cd moltworker
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a development configuration:
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your configuration
   ```

5. Start development:
   ```bash
   npm run start
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the coding standards in this project

3. Test your changes:
   ```bash
   npm run typecheck
   npm test
   ```

4. Commit your changes with descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add voice recognition support
fix: resolve WebSocket connection timeout
docs: update installation instructions
test: add unit tests for auth middleware
```

## Code Quality

### Type Checking

All code must pass TypeScript type checking:
```bash
npm run typecheck
```

### Testing

- Add tests for new features
- Ensure all existing tests pass
- Aim for good test coverage

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Pre-commit Hooks

We use Husky for pre-commit hooks that automatically:
- Run type checking on staged files
- Run tests on staged files

## Pull Requests

### Process

1. Push your branch to your fork
2. Open a pull request against `main`
3. Fill out the PR template completely
4. Wait for code review
5. Address any feedback
6. Get approval and merge

### PR Requirements

- All tests must pass
- Type checking must pass
- Code must follow project conventions
- Documentation must be updated if applicable
- PR description must be clear and complete

## Code Style

### TypeScript

- Use explicit types for function signatures
- Prefer interfaces over types for object shapes
- Use strict TypeScript mode

### File Organization

- Keep related files together
- Use clear, descriptive names
- Follow the existing directory structure

### Comments

- Add comments for complex logic
- Use JSDoc for public functions
- Keep comments up-to-date

## Reporting Issues

When reporting bugs, please:

1. Use the bug report issue template
2. Provide clear steps to reproduce
3. Include environment information
4. Add relevant logs or screenshots

## Feature Requests

For feature requests:

1. Use the feature request issue template
2. Describe the problem you're trying to solve
3. Explain the proposed solution
4. Consider alternative approaches

## Getting Help

- Check the [documentation](README.md)
- Search existing issues
- Join discussions in existing issues
- Create a new issue using the question template

## Project Structure

Key directories:

```
src/
├── auth/           # Authentication and authorization
├── gateway/        # Moltbot gateway management
├── routes/         # API route handlers
├── client/         # React admin UI
└── types.ts        # TypeScript type definitions
```

## Release Process

Releases are managed through pull requests to main. Ensure your PR follows the semantic versioning impact when merging.

## Code of Conduct

Be respectful and constructive in all interactions. We're here to learn and build together.

Thank you for contributing! 🎉