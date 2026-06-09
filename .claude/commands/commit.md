---
description: Create a git commit using Conventional Commits format
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
---

# Conventional Commit

Create a git commit for the current changes following the **Conventional Commits** specification.

## Context

- Current status: !`git status --short`
- Staged diff: !`git diff --cached --stat`
- Unstaged diff: !`git diff --stat`
- Recent commits (style reference): !`git log --oneline -10`

## Instructions

1. Review the changes above. If nothing is staged, stage the relevant modified/new files with `git add` (never use `git add -A` blindly — exclude unrelated files, secrets, or `.env` files).
2. Analyze the diff and write a commit message in Conventional Commits format:

   ```
   <type>(<scope>): <subject>

   [optional body]
   ```

   **Types:**
   - `feat` — new feature
   - `fix` — bug fix
   - `docs` — documentation only
   - `style` — formatting, no code change
   - `refactor` — code change that neither fixes a bug nor adds a feature
   - `perf` — performance improvement
   - `test` — adding or fixing tests
   - `build` — build system or dependencies
   - `ci` — CI configuration
   - `chore` — maintenance, tooling

   **Scope** (optional but preferred) — area of this monorepo affected, e.g.: `db`, `ui`, `auth`, `panel`, `menu`, `api`, `seo`, `i18n`, `config`.

   **Rules:**
   - Subject in imperative mood, lowercase, no trailing period, ≤ 72 chars.
   - Add a body only when the "why" isn't obvious from the subject.
   - Breaking changes: append `!` after type/scope (e.g. `feat(api)!:`) and add a `BREAKING CHANGE:` footer.
   - If changes span multiple unrelated concerns, propose splitting into multiple commits and ask before proceeding.

3. Commit with the message. Do NOT push unless explicitly asked.
4. Show the result with `git log -1 --stat`.

$ARGUMENTS
