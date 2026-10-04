---
name: updating-repo-docs
description: Use when you have changed files in a repository and are about to report the work as done, commit, or open a PR — especially when the repo has a CLAUDE.md, AGENTS.md, or README.md.
---

# Updating Repo Docs

## Overview

CLAUDE.md and README.md describe the repo to the next agent and the next human. A code change that makes either file wrong (or leaves out something it now needs) is not finished.

## The check

Before your final message, commit, or PR:

1. List the doc files: `git ls-files '*CLAUDE.md' '*AGENTS.md' '*README.md'` (include nested ones; skip vendored/generated READMEs).
2. Read each one in full against your diff (`git diff` + untracked files).
3. Edit every statement your change made wrong or incomplete, using the table below.
4. Put the **Docs** line in your final report (required, see below).

| Your change added/altered… | Look in CLAUDE.md for… | Look in README.md for… |
|---|---|---|
| Service, module, provider, layer | Architecture lists, counts ("four services"), wiring/DI notes | Tech stack |
| Dependency or platform permission | Setup, conventions | Tech stack, prerequisites |
| Command, script, build/test step | Commands section | Install / usage |
| Env var, config file, secret | Local setup, CI notes | Setup steps |
| User-visible feature or behavior | Feature-specific gotchas | Features list |
| Convention future edits must follow | Rules/patterns sections | — |

Match each file's existing tone and density. CLAUDE.md holds non-obvious guidance, not a file inventory. Don't create a CLAUDE.md or README.md that doesn't exist; mention it in the report instead.

## Stale text that predates your change

- **The stale statement covers an area your change touched** (the service list your new service belongs to, the features list your feature belongs in): fix it. Your change can't be documented correctly on top of a wrong statement.
- **It's somewhere your change didn't touch**: don't edit it. List it under "Noticed" in the Docs line so the user can decide.

## Required: Docs line in the final report

```
Docs: updated CLAUDE.md (architecture: added FooService, corrected service count); README.md (features: added X).
Noticed (not changed): README says storage is SharedPreferences; it's sqflite.
```

or, when nothing applied:

```
Docs: checked CLAUDE.md, README.md — no change needed (internal refactor, no public surface changed).
```

A report without a Docs line means the check wasn't done.

## Red flags

| Thought | Reality |
|---|---|
| "That line was already stale before my change" | If it's in the area you touched, fix it. Otherwise list it under Noticed. Never ignore it silently. |
| "README is user-facing, this was internal" | Check the features and tech stack first. New dependencies and permissions often show up there. |
| "The user just wants to commit" | Editing the docs takes a minute. A stale CLAUDE.md misleads every session after this one. |
| "CHANGELOG covers it" | A changelog records history. CLAUDE.md and README describe the current state. Generated changelogs are never hand-edited. |
