# Contributing to shadow-boxer

We welcome contributions, bug reports, and feature proposals to `shadow-boxer`. Please read through these guidelines before submitting a pull request.

## Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/code-dibyajyotirout/shadow-boxer-npm-package.git
   cd shadow-boxer-npm-package
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run automated tests:
   ```bash
   npm test
   ```

4. Run typechecking:
   ```bash
   npm run typecheck
   ```

5. Build the library bundle:
   ```bash
   npm run build:lib
   ```

## Code Standards

- Maintain zero emojis in code comments, documentation, and commit messages.
- Ensure 100% test pass rate for any new kinematics or signal processing algorithms.
- Provide TypeScript types for all new public interfaces and subpath exports.

## Pull Request Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`.
2. Ensure `npm run prepublishOnly` passes cleanly before committing.
3. Open a Pull Request referencing related issues and describing the motivation and technical approach.
