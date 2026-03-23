# CW Clicker Branding and Docs Design

## Goal

Rename the app publicly to CW Clicker and refresh the documentation so it explains how the game works clearly.

## Scope

- Update user-facing app title text from CW Clicker / CW Clicker to CW Clicker where appropriate.
- Expand `README.md` with a clearer gameplay overview, progression, and system descriptions.
- Update `AGENTS.md` wording where it still refers to the old app name in guidance text.
- Keep historical plan/spec filenames unchanged unless they are user-facing.

## Approach

- Treat `CW Clicker` as the public app name.
- Keep the Morse-radio theme intact in gameplay text and feature descriptions.
- Use plain English and ASCII examples in the README instead of screenshots.

## Files to Update

- `index.html`
- `src/components/StatHeader.vue`
- `src/components/MigrationNotification.vue`
- `README.md`
- `AGENTS.md`

## Acceptance Criteria

- The visible app title says CW Clicker.
- The live QSOs counter remains formatted consistently with the rest of the app.
- The README explains what the game is, how to play, how factories work, and how progression works.
- AGENTS guidance reflects the current app name where it is user-facing.
- No screenshots are required; the README can use text and ASCII examples.
