# AGENTS.md - Agentic Coding Guidelines

This file provides guidelines for AI agents working in this repository.

## Project Overview

This repository uses a three-layer configuration system for OpenCode:
1. **Context-mode** - Context window protection and session continuity
2. **Superpowers** - Development process discipline and workflows  
3. **ECC** - Language-specific patterns and domain knowledge

---

## Section 1: Context-Mode Routing Rules

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
3. **PROCESSING**: `context-mode_ctx_execute` or `ctx_execute_file` — Sandbox execution
4. **WEB**: `context-mode_ctx_fetch_and_index` then `ctx_search` — Web content
5. **INDEX**: `context-mode_ctx_index(content, source)` — Store for later search

### Output Constraints

- Keep responses under 500 words
- Write artifacts (code, configs) to FILES — never inline text
- Use descriptive source labels when indexing (e.g., `source: "React docs"`)

### Utility Commands

| Command | Action |
|---------|--------|
| `ctx stats` | Context savings report |
| `ctx doctor` | Diagnostics checklist |
| `ctx upgrade` | Upgrade to latest version |

---

## Section 2: Superpowers Skills

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

## Section 3: ECC Skills

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

## Section 4: Skill Selection Guide

**Critical: Avoid skill conflicts by using the right tool for each task.**

### Overlap Matrix

| Task | Use This | Not That | Reason |
|------|----------|----------|--------|
| TDD workflow | Superpowers `test-driven-development` | ECC `tdd-workflow` | Superpowers has stricter enforcement |
| Verification | Superpowers `verification-before-completion` | ECC `verification-loop` | Better checkpoints |
| Code review process | Superpowers `requesting-code-review` | ECC general `code-review` | Process-focused |
| Go idioms & patterns | ECC `golang-patterns` | — | Language-specific knowledge |
| Security audit | ECC `security-review` | — | Fills superpowers gap |
| API design | ECC `api-design` | — | Domain-specific patterns |
| Debugging | Superpowers `systematic-debugging` | — | Proven methodology |
| Planning | Superpowers `writing-plans` | — | Comprehensive task breakdown |

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

## Section 5: Usage Examples

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

---

## Section 6: Build/Test/Lint Commands

This repo uses npm scripts for build, test, and lint. Prefer `npx vitest run` or `npm test` when verifying changes, and `npm run build` before release.

### Save Data Compatibility

- Keep the localStorage key `cw-keyer-game` unchanged unless you also add a migration path.
- The old storage key is intentionally preserved so existing player saves continue to load.

### Version Bumps

- When bumping a release version, update `VERSION` and `src/stores/game.js` (`GAME_VERSION`) together.
- Do not rely on `package.json` for game migration/version behavior; it is package metadata only.

If adding code in the future:
- Use `npm` as the supported package manager
- Add appropriate package.json scripts for linting/formatting

---

## Section 7: Code Style Guidelines

### Markdown Documentation
- Use ATX-style headers (`#` not `===` underlines)
- Wrap lines at 100 characters
- Use fenced code blocks with language identifiers
- Use `-` for unordered lists, `1.` for ordered
- Reference file paths in backticks: `path/to/file`

### JSON Configuration
- Use 2-space indentation
- Prefer trailing commas in multi-line arrays/objects
- Sort keys alphabetically where logical
- Use lowercase with hyphens for file names

### File Organization
- Configuration files go in `~/.config/opencode/`
- Custom skills go in `~/.config/opencode/skills/`
- Documentation stays in repository root or `docs/`
- Use descriptive, kebab-case filenames

---

## Section 8: AI Agent Instructions

### When Working in This Repo

1. **Follow context-mode routing rules** — Always use sandbox tools for large outputs
2. **Trust superpowers skills** — They trigger automatically for good reason
3. **Request ECC skills explicitly** — When you need language-specific knowledge
4. **Prefer editing existing files** over creating new ones
5. **Follow existing file naming patterns**
6. **Maintain consistency** with existing documentation style
7. **Ask before making structural changes**
8. **Update README.md** if adding major features

### Before Committing

- Run `ctx stats` to verify context savings
- Review changes for accuracy
- Ensure no secrets are exposed
- Verify documentation is clear and complete
- Use superpowers `verification-before-completion`

---

## References

- [Context-mode](https://github.com/mksglu/context-mode) - Context window protection
- [Superpowers](https://github.com/obra/superpowers) - Development workflow
- [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) - ECC repository
- [OpenCode Documentation](https://opencode.ai)

## ECC Skills Reference

The following ECC skills are available for language-specific patterns and domain knowledge.
Use these to complement superpowers' process skills.

### Language-Specific Patterns

**Go**
- **golang-patterns** - Idiomatic Go patterns, concurrency, error handling
- **golang-testing** - Go testing patterns, TDD, benchmarks
- **go-reviewer** agent - Go code review specialist

**TypeScript/JavaScript**
- **frontend-patterns** - React, Next.js patterns
- **backend-patterns** - API, database, caching patterns
- **api-design** - REST API design, pagination, error responses
- **e2e-testing** - Playwright E2E patterns
- **typescript-reviewer** agent - TypeScript code review

**Python**
- **python-patterns** - Pythonic idioms, PEP 8, type hints
- **python-testing** - Python testing with pytest
- **python-reviewer** agent - Python code review

**Rust**
- **rust-patterns** - Idiomatic Rust patterns, ownership, error handling
- **rust-testing** - Rust testing patterns
- **rust-reviewer** agent - Rust code review

### Security & Documentation

- **security-review** - Security audit checklist and patterns
- **security-reviewer** agent - Security-focused code review
- **documentation-lookup** - API reference research
- **docs-lookup** agent - Documentation lookup specialist
- **search-first** - Research-before-coding methodology

### Skill Selection Guide

**When to use Superpowers vs ECC:**

| Task Type | Use This | Not That |
|-----------|----------|----------|
| TDD workflow | Superpowers `test-driven-development` | ECC `tdd-workflow` |
| Verification | Superpowers `verification-before-completion` | ECC `verification-loop` |
| Code review process | Superpowers `requesting-code-review` | ECC general code-review |
| Go idioms & patterns | ECC `golang-patterns` | - |
| Security audit | ECC `security-review` | - |
| API design | ECC `api-design` | - |

**Usage Examples:**
- "Use golang-patterns to refactor this handler"
- "Apply security-review to the authentication module"
- "Use api-design principles for this endpoint"
