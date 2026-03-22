# AI Agent Guidelines for CW Keyer Idle Game

This file provides instructions for any agentic AI system working on this project. By following these guidelines, you will ensure high code quality, consistency, and alignment with the project's vanilla web stack.

## 1. Project Overview

**CW Keyer Idle Game** is a browser-based single-player idle game featuring a ham radio theme. Players tap a Morse code keyer to earn QSOs, which they spend on factories and licenses.

- **Tech Stack**: Vue 3, Vite, Pinia, ES6+, HTML5, CSS3/Tailwind, Web Audio API, `localStorage`.
- **Architecture**: Vue 3 SPA with Pinia for state management, Vite for build tooling, no backend.
- **Key Modules**: Game Loop (`requestAnimationFrame`), Audio Context (lazy init), Pinia Store, Vue Components, UI/DOM Updater.

## 2. Build, Run, and Test Commands

This project uses Vue 3 with Vite build tooling. Follow these practices:

### Running the Application

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

All tests must pass before committing. Current test count: 165 tests across 14 test files.

### Linting & Formatting

```bash
# Run linter with auto-fix
npm run lint

# Check linting without fixing
npm run lint:check

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

### Manual Verification

For logic that isn't covered by tests, you may write temporary Node.js scripts to verify behavior, but prefer adding proper unit tests instead.

## 3. Code Style Guidelines

### 3.1 JavaScript Standards

- **Strict Mode**: Always use `"use strict";` at the top of JS files.
- **ES6+ Features**: Use `const` and `let` (never `var`). Use arrow functions, destructuring, template literals, and default parameters.
- **Modularity**: Use ES6 modules (`import` / `export`) to keep code organized. Separate concerns into logical files (e.g., `state.js`, `audio.js`, `ui.js`, `engine.js`).

### 3.2 Typing and Documentation

- Since there is no TypeScript, use **JSDoc** comments extensively for all functions, classes, and complex data structures.
- Example:
  ```javascript
  /**
   * Calculates the cost of the next factory.
   * @param {number} baseCost - The initial cost of the factory.
   * @param {number} owned - The number of factories currently owned.
   * @returns {number} The cost of the next factory.
   */
  ```

### 3.3 Naming Conventions

- **Variables & Functions**: Use `camelCase` (e.g., `generateQso`, `isAudioEnabled`).
- **Classes**: Use `PascalCase` (e.g., `FactoryManager`, `GameLoop`).
- **Constants**: Use `UPPER_SNAKE_CASE` (e.g., `BASE_TICK_RATE`, `MAX_OFFLINE_HOURS`).
- **DOM Elements**: Prefix with `$` or use a clear descriptive name (e.g., `$keyerButton`, `qsoCounterDisplay`).

### 3.4 Formatting

- **Indentation**: 2 spaces.
- **Quotes**: Single quotes (`'`) for JS strings, double quotes (`"`) for HTML attributes.
- **Semicolons**: Always use semicolons.
- **Braces**: Always use braces for `if`/`else` statements, even for single lines.

### 3.5 Error Handling & Storage

- **localStorage**: Wrap all `localStorage` reads and writes in `try/catch` blocks. Browsers can throw `QuotaExceededError` or disable storage entirely in private modes.
- **Graceful Degradation**: If storage fails, log a warning to the console and allow the game to continue in memory.

### 3.6 DOM Manipulation & UI

- Prefer `document.querySelector` and `document.getElementById`.
- To attach events, use `addEventListener` rather than inline HTML attributes (e.g., `onclick`).
- Batch DOM updates when possible. Do not update the DOM on every `requestAnimationFrame` tick if the value hasn't changed. Throttle UI updates to improve performance.

### 3.7 Performance Considerations

- **Big Numbers**: Use JS `BigInt` or a custom string math approach for large QSO numbers, as idle games can easily exceed `Number.MAX_SAFE_INTEGER`.
- **Audio Context**: Browsers block autoplaying audio. Initialize the `AudioContext` only _after_ the user's first interaction (click/touchstart).

## 4. Agent Operational Directives

- **Plan First**: Consult `.planning/` documents (e.g., `ROADMAP.md`, `REQUIREMENTS.md`) before writing code.
- **Incremental Changes**: Make small, verifiable changes. Do not rewrite large chunks of the architecture unless requested.
- **No Extraneous Dependencies**: Do NOT add npm packages or external libraries unless specifically instructed. The constraints specify Vanilla JS only.
- **Follow the Constraints**: This game is meant to be a humorous, simple clicker. Keep the code simple and readable. Don't overengineer abstractions.

---

## 5. Context-Mode Routing Rules

**PRIORITY: CRITICAL** - These rules protect your context window from flooding.

You have context-mode MCP tools available. These rules are NOT optional.

### BLOCKED Commands

**curl / wget** — BLOCKED

- Any shell command containing `curl` or `wget` will be intercepted
- Do NOT retry with shell
- **Instead use:** `context-mode_ctx_fetch_and_index(url, source)`

**Inline HTTP** — BLOCKED

- Commands with `fetch('http`, `requests.get(`, `requests.post(`, etc.
- Do NOT retry with shell
- **Instead use:** `context-mode_ctx_execute(language, code)`

**Direct web fetching** — BLOCKED

- Do NOT use any direct URL fetching tool
- **Instead use:** `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)`

### REDIRECTED Tools

**Shell (>20 lines output)**

- Shell is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, short commands
- **Instead use:**
  - `context-mode_ctx_batch_execute(commands, queries)` - Run multiple + search
  - `context-mode_ctx_execute(language: "shell", code: "...")` - Sandbox execution

**File reading (for analysis)**

- If reading to **edit** → `Read` tool is correct
- If reading to **analyze/explore/summarize** → `context-mode_ctx_execute_file(path, language, code)`

**grep / search (large results)**

- Search results can flood context
- **Instead use:** `context-mode_ctx_execute(language: "shell", code: "grep ...")`

### Tool Selection Hierarchy

1. **GATHER**: `context-mode_ctx_batch_execute(commands, queries)` — Primary tool
2. **FOLLOW-UP**: `context-mode_ctx_search(queries: [...])` — Query indexed content
3. **PROCESSING**: `context-mode_ctx_execute` or `context-mode_ctx_execute_file` — Sandbox execution
4. **WEB**: `context-mode_ctx_fetch_and_index` then `ctx_search` — Web content
5. **INDEX**: `context-mode_ctx_index(content, source)` — Store for later search

### Output Constraints

- Keep responses under 500 words
- Write artifacts (code, configs) to FILES — never inline text
- Use descriptive source labels when indexing (e.g., `source: "React docs"`)

### Utility Commands

| Command       | Action                    |
| ------------- | ------------------------- |
| `ctx stats`   | Context savings report    |
| `ctx doctor`  | Diagnostics checklist     |
| `ctx upgrade` | Upgrade to latest version |

---

## 6. Superpowers Skills

Superpowers provides **process discipline** and **development workflows**. These skills trigger automatically based on context.

### Core Workflow Skills

**brainstorming** — Use before any creative work

- Socratic design refinement through questions
- Explores alternatives and presents design in sections
- Auto-triggers when you start discussing features

**writing-plans** — Use when you have a spec/requirements

- Breaks work into bite-sized tasks (2-5 minutes each)
- Every task has exact file paths, complete code, verification steps
- Auto-triggers after design approval

**executing-plans** — Use when executing written plans

- Batch execution with human checkpoints
- Alternative to subagent-driven-development for current session

**subagent-driven-development** — Use for complex multi-step work

- Dispatches fresh subagent per task
- Two-stage review: spec compliance, then code quality
- Can work autonomously for hours

**using-git-worktrees** — Use when starting feature work

- Creates isolated workspace on new branch
- Runs project setup, verifies clean test baseline
- Auto-triggers after design approval

### Quality Assurance Skills

**test-driven-development** — Use when implementing any feature or bugfix

- Enforces RED-GREEN-REFACTOR: write failing test → watch fail → write minimal code → watch pass → commit
- **Iron Law**: Deletes code written before tests
- Auto-triggers during implementation

**systematic-debugging** — Use when encountering any bug

- 4-phase root cause process
- Includes techniques: root-cause-tracing, defense-in-depth, condition-based-waiting

**verification-before-completion** — Use before claiming work is complete

- Ensure it's actually fixed
- Runs verification before commits/PRs

### Code Review Skills

**requesting-code-review** — Use when completing tasks or implementing major features

- Pre-review quality checks
- Reviews against plan, reports issues by severity
- Critical issues block progress

**receiving-code-review** — Use when receiving code review feedback

- Technical rigor and verification
- Handles unclear or questionable feedback
- Not performative agreement

### Completion Skills

**finishing-a-development-branch** — Use when tasks complete

- Verifies tests
- Presents options: merge/PR/keep/discard
- Cleans up worktree

### Meta Skills

**writing-skills** — Use when creating new skills

- Follows best practices for skill creation
- Includes testing methodology

**using-superpowers** — Entry point

- Introduction to the skills system
- Triggers automatically at session start

---

## 7. ECC Skills

ECC provides **language-specific patterns** and fills gaps in superpowers. Request these explicitly in your prompts.

### Language-Specific Patterns

#### Go

- **golang-patterns** — Idiomatic Go patterns, concurrency, error handling, best practices
- **golang-testing** — Go testing patterns, TDD, benchmarks, table-driven tests
- **go-reviewer** agent — Go code review specialist (idiomatic Go, concurrency, error handling)

#### TypeScript/JavaScript

- **frontend-patterns** — React, Next.js patterns and best practices
- **backend-patterns** — API, database, caching patterns (TS/JS examples)
- **api-design** — REST API design, pagination, error responses
- **e2e-testing** — Playwright E2E patterns and Page Object Model
- **typescript-reviewer** agent — TypeScript code review specialist

#### Python

- **python-patterns** — Pythonic idioms, PEP 8, type hints, best practices
- **python-testing** — Python testing with pytest, fixtures, parametrization
- **python-reviewer** agent — Python code review specialist

#### Rust

- **rust-patterns** — Idiomatic Rust patterns, ownership, error handling, traits
- **rust-testing** — Rust testing patterns, mocking strategies
- **rust-reviewer** agent — Rust code review specialist

### Security & Documentation

- **security-review** — Comprehensive security checklist and patterns
- **security-reviewer** agent — Security-focused code review
- **documentation-lookup** — API reference research workflow
- **docs-lookup** agent — Documentation lookup specialist
- **search-first** — Research-before-coding methodology

---

## 8. Skill Selection Guide

**Critical: Avoid skill conflicts by using the right tool for each task.**

### Overlap Matrix

| Task                 | Use This                                     | Not That                  | Reason                               |
| -------------------- | -------------------------------------------- | ------------------------- | ------------------------------------ |
| TDD workflow         | Superpowers `test-driven-development`        | ECC `tdd-workflow`        | Superpowers has stricter enforcement |
| Verification         | Superpowers `verification-before-completion` | ECC `verification-loop`   | Better checkpoints                   |
| Code review process  | Superpowers `requesting-code-review`         | ECC general `code-review` | Process-focused                      |
| Go idioms & patterns | ECC `golang-patterns`                        | —                         | Language-specific knowledge          |
| Security audit       | ECC `security-review`                        | —                         | Fills superpowers gap                |
| API design           | ECC `api-design`                             | —                         | Domain-specific patterns             |
| Debugging            | Superpowers `systematic-debugging`           | —                         | Proven methodology                   |
| Planning             | Superpowers `writing-plans`                  | —                         | Comprehensive task breakdown         |

### Decision Tree

**Starting a new feature?**

1. Superpowers `brainstorming` → Refine requirements
2. Superpowers `writing-plans` → Create implementation plan
3. ECC `search-first` → Research APIs/approaches
4. Superpowers `using-git-worktrees` → Create isolated branch

**Writing code?**

- Superpowers `test-driven-development` → TDD workflow
- ECC `golang-patterns` (or language-specific) → Language idioms
- Superpowers `systematic-debugging` → If bugs arise

**Reviewing code?**

- Superpowers `requesting-code-review` → Process checks
- ECC `go-reviewer` (or language-specific) → Language review
- ECC `security-review` → Security audit

**Finishing up?**

- Superpowers `verification-before-completion` → Final checks
- Superpowers `finishing-a-development-branch` → Merge decision

---

## 9. Optimized Fork Workflow

This repository uses the **fork method** for all contributions. To streamline the workflow, use the helper script at `scripts/git-fork-workflow.sh`.

### Setup

```bash
# Load helper functions (add to your shell profile for persistence)
source scripts/git-fork-workflow.sh
```

### Quick Start

```bash
# One command to start new work - syncs fork, creates branch
git-fork-workflow feature-branch-name

# Make changes, commit, then push and create PR
git add . && git commit -m "Add feature"
git-push-feature && git-pr
```

### Available Commands

| Command                      | Description                                |
| ---------------------------- | ------------------------------------------ |
| `git-fork-workflow <branch>` | Complete setup: sync fork → create branch  |
| `git-sync-upstream`          | Sync your fork with dbehnke/cwclicker main |
| `git-feature <name>`         | Create a new feature branch                |
| `git-push-feature`           | Push current branch to your fork           |
| `git-pr`                     | Create PR with auto-filled title/body      |
| `git-fork-status`            | Check branch status and pending commits    |

### Why Fork Method?

- **Safety** - Can't accidentally push to main
- **Review required** - All changes go through PR review
- **Clean history** - Maintains linear commit history
- **Works everywhere** - Standard open-source workflow

### Typical Session

```bash
# 1. Start fresh work
git-fork-workflow add-dark-mode

# 2. Make changes, test, commit
git add . && git commit -m "feat: add dark mode toggle"

# 3. Push and create PR
git-push-feature && git-pr

# 4. Browser opens - review and submit PR
```

### Troubleshooting

**"Permission denied" on push:**

- Ensure fork remote is set: `git remote add fork https://github.com/trinity-ai-agent/cwclicker.git`
- Check auth: `gh auth status`

**Out of sync with upstream:**

- Run `git-sync-upstream` before creating new branches
- Rebases your local main onto upstream/main

**PR already exists:**

- Push additional commits to same branch
- PR updates automatically

---

## 10. Usage Examples

### Context-Mode Examples

```
"Fetch the React documentation and summarize it"
→ Use ctx_fetch_and_index + ctx_search

"Analyze this 500-line log file"
→ Use ctx_execute_file

"Run these 5 commands and summarize results"
→ Use ctx_batch_execute
```

### Superpowers Examples

```
"Help me plan a user authentication feature"
→ Triggers: brainstorming → writing-plans

"Let's implement the login system"
→ Triggers: test-driven-development

"Debug why this test is failing"
→ Triggers: systematic-debugging

"Review this code before I commit"
→ Triggers: requesting-code-review
```

### ECC Examples

```
"Use golang-patterns to refactor this HTTP handler"
→ Applies Go idioms and patterns

"Apply security-review to the authentication module"
→ Runs security audit checklist

"Use api-design principles for this new endpoint"
→ REST API best practices

"Research the Stripe API documentation"
→ Uses documentation-lookup + search-first
```
