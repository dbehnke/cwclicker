# Contributing

Thanks for contributing! A few notes to get your development environment set up correctly for this repository.

## Local setup

1. Use Node.js 24.x (this project targets Node 24; see `package.json` engines).
2. Install dependencies deterministically with npm:

   npm ci

   Note: use `npm ci` instead of `npm install` for consistent installs that match `package-lock.json`.

3. Husky git hooks are installed by the `prepare` script. After `npm ci` the hooks will be set up automatically. If hooks are not present locally, run:

   npm run prepare

4. Pre-commit hooks run `lint-staged` to format and lint staged files (Prettier + ESLint). If a hook prevents commit, run the configured linters locally to fix issues:

   npm run format
   npm run lint

## Running tests

- Run the full test suite with:

  npm test

- Run coverage (locally):

  npm run test:coverage

## Formatting & Linting

- Format the repository:

  npm run format

- Check formatting:

  npm run format:check

- Run ESLint (fixing where possible):

  npm run lint

- Check ESLint without fixing:

  npm run lint:check

## CI behavior

- CI enforces `npm ci --dry-run` to ensure `package.json` and `package-lock.json` stay in sync.
- The repository uses Node.js 24.x in CI; please match versions locally when running tests.

## Notes

- If you add or update dependencies, run:

  npm install <pkg> --save-dev

  and then commit the updated `package-lock.json`. The CI lockfile-check will fail if `package.json` and `package-lock.json` drift.

- If you need help, open an issue or ping the maintainers.
