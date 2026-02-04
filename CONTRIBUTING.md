# Contributing to husky-image-guard

Thank you for your interest in contributing! Here's how to get started.

## Prerequisites

- Node.js >= 16
- npm >= 8

## Getting Started

```bash
# Clone the repository
git clone https://github.com/tcisse/husky-image-guard.git
cd husky-image-guard

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Project Structure

```
husky-image-guard/
├── src/
│   ├── cli.ts            # CLI entry point
│   ├── index.ts          # Core logic (checkImages, loadConfig)
│   ├── init.ts           # Init command
│   ├── postinstall.ts    # Post-install script
│   └── types.ts          # TypeScript types
├── tests/
│   └── index.test.ts     # Unit tests
├── dist/                 # Compiled output
└── .changeset/           # Changesets for versioning
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** in the `src/` directory
4. **Write or update tests** in `tests/`
5. **Run tests** to make sure everything passes:
   ```bash
   npm test
   ```
6. **Add a changeset** to describe your changes:
   ```bash
   npm run changeset
   ```
   Choose the appropriate bump type:
   - `patch` — bug fixes
   - `minor` — new features (backward compatible)
   - `major` — breaking changes
7. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: description of your change"
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** targeting the `release` branch

## Commit Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

| Type     | Description                          | Example                              |
|----------|--------------------------------------|--------------------------------------|
| `feat`   | New feature                          | `feat: add WebP format support`      |
| `fix`    | Bug fix                              | `fix: handle missing config file`    |
| `docs`   | Documentation changes                | `docs: update README examples`       |
| `chore`  | Maintenance / tooling                | `chore: update dependencies`         |
| `test`   | Test changes                         | `test: add edge case for large files`|
| `refactor` | Code restructure (no behavior change) | `refactor: extract size parser`    |

## Writing Tests

Tests are written with **Jest** and **ts-jest**. Add your tests in `tests/`:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Code Guidelines

- Use **TypeScript** for all source files
- Keep functions focused and small
- Add types in `src/types.ts` when needed
- Don't forget to update the README if your change affects the public API

## Reporting Issues

Open an issue on [GitHub Issues](https://github.com/tcisse/husky-image-guard/issues) with:
- A clear description of the problem or feature request
- Steps to reproduce (for bugs)
- Your environment (Node.js version, OS)

## License

By contributing, you agree that your contributions will be licensed under the **MIT License**.
