---
name: repo-review
description: Use when asked to scan, audit, or review the whole repo for bugs, security vulnerabilities, performance problems, tech debt, or feature ideas, or for a prioritised backlog or review.html of what to fix.
---

# Repo Review

Scan the current repo and write `review.html`: prioritised findings across five categories, with filter, search, and done-checkboxes. Every finding carries **evidence**: code you opened, at a file and line.

## Finding schema

One JSON object per finding, collected in `findings.json` (an array):

| Field | Value |
|---|---|
| `category` | `security` · `bug` · `performance` · `tech-debt` · `feature` |
| `priority` | `P0` · `P1` · `P2` · `P3` (table below) |
| `effort` | `S` (under an hour) · `M` (a day) · `L` (more) |
| `title` | The defect or opportunity in one line |
| `file`, `line` | Primary location; `line` optional; `file` is `(repo)` for repo-wide items |
| `description` | What is wrong and who or what it hurts |
| `evidence` | The offending lines, quoted from the file |
| `recommendation` | The concrete fix or first step |

## Priority

Rank by blast radius times likelihood. A finding sits on the highest row it meets.

| | Bug, security, performance | Tech debt | Feature |
|---|---|---|---|
| **P0** | Exploitable now, data loss, or crash on a main path | Blocks safe change to core code | n/a |
| **P1** | Reachable defect with real impact; auth, injection, or secrets exposure that needs a precondition | Slows every change in a hot area | Fills a gap users hit today |
| **P2** | Edge-case defect; measurable slowdown off the hot path | Local mess with a clear cleanup | Clear value, moderate scope |
| **P3** | Hardening, polish, theoretical | Cosmetic | Nice to have |

## Steps

### 1. Scope

Run `git ls-files` and read the README, manifests, and entry points. Name the stack, the main flows (request handling, data access, auth, background work), and the directories to skip (vendored, generated, build output, lockfiles). Done when every category in step 2 has a list of the files that matter for it.

### 2. Sweep

Read `references/checklists.md`, then sweep the in-scope files once per category. Run categories as parallel subagents when the repo has more than a few hundred source files; hand each the schema and priority table above.

Done when every checklist item has been checked against the code and either produced a finding or been cleared.

### 3. Verify

Re-open the file behind each candidate. Keep the finding only when the quoted `evidence` is on the page and the failure path holds end to end: trace the input to the sink, the caller to the crash. Drop what you cannot demonstrate, and mark a plausible-but-untraced risk as `P3` with the gap stated in `description`.

Secrets: put the key's type and location in the finding and redact the value (first four characters, then `…`).

### 4. Prioritise

Assign `priority` from the table and `effort` from the recommendation. Merge duplicates: one finding per root cause, listing other locations in `description`. Features come from gaps the code itself shows (stubbed handlers, TODOs, missing CRUD verbs, absent config or observability), each anchored to a file.

### 5. Build

Write `findings.json` to the scratchpad, then from the repo root:

```bash
node <skill-dir>/scripts/build-review.mjs <scratchpad>/findings.json review.html
```

The script validates the schema, assigns stable ids (re-scans keep a user's ticked checkboxes), and embeds the findings in the HTML template. Fix every error it lists and re-run until it exits 0.

### 6. Report

Tell the user: the path to `review.html`, the finding counts by priority and category, the top three P0/P1 items in one line each, and anything skipped (unreadable areas, scopes you excluded). Offer to add `review.html` to `.gitignore`; leave it for the user to decide.
