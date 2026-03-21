# AI Agent Guidelines for CW Keyer Idle Game

This file provides instructions for any agentic AI system working on this project. By following these guidelines, you will ensure high code quality, consistency, and alignment with the project's vanilla web stack.

## 1. Project Overview

**CW Keyer Idle Game** is a browser-based single-player idle game featuring a ham radio theme. Players tap a Morse code keyer to earn QSOs, which they spend on factories and licenses.

- **Tech Stack**: Vanilla JavaScript (ES6+), HTML5, CSS3, Web Audio API, `localStorage`.
- **Architecture**: No build step, no framework (React/Vue/Svelte are out of scope), no backend.
- **Key Modules**: Game Loop (`requestAnimationFrame`), Audio Context (lazy init), State/Storage Manager, UI/DOM Updater.

## 2. Build, Run, and Test Commands

Since this is a zero-build vanilla project, there is no standard `package.json` setup out of the box. Follow these practices:

### Running the Application

Serve the root directory using any local web server:

- Python: `python3 -m http.server 8000`
- Node/npx: `npx serve .` or `npx live-server`
- Avoid accessing `index.html` via `file://` protocol to prevent CORS issues with ES6 modules or Web Audio API.

### Linting & Formatting

No automated linters are currently installed. You must act as the linter:

- Ensure there are no unused variables.
- Ensure strict formatting according to the guidelines below.

### Testing

There is no automated test suite by default.

- If you are tasked with verifying pure logic (e.g., cost scaling math or factory generation), write a temporary pure Node.js script to log assertions, run it via `node temp-test.js`, and remove it once verified.
- For UI or Audio testing, you must rely on careful DOM construction and mock `window` APIs if attempting to run logic headlessly.

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
