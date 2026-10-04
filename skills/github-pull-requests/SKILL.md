---
name: github-pull-requests
description: Use when creating, opening, drafting, or reviewing a GitHub pull request, writing a PR description, or posting a PR review with the gh CLI.
---

# GitHub Pull Requests

## Overview
Every PR uses one template, and every fact has exactly one slot in it. Reviews use one fixed shape. Consistency is the point: a reviewer should find test results, breaking changes and risks in the same place on every PR.

## Before creating a PR
1. `git log <base>..HEAD` and read the full `git diff <base>...HEAD`, not just `--stat`.
2. Run the tests. If they fail, stop and report; don't open the PR.
3. Scan the diff for secrets (keys, tokens, `.env` values). If found, stop: do not push. Tell the user the commit must be rewritten and the secret rotated.
4. Describe the change **against the base branch**, not the commit history. Fixes to bugs introduced earlier on the same branch are not "Bug fix".

## PR body contract
Title: imperative, under 70 chars. Pass the body with `gh pr create --base <base> --title "<title>" --body-file - <<'EOF'`.

The body is exactly these sections, in this order. Delete the template's placeholder text; every slot holds real content or the stated fallback.

```markdown
# <same text as --title>

## Type of Task
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] UI/UX improvement

## 🖹 Description
- **What:** <what was added/modified>
- **Why:** <why the change was necessary>
- **Technical details:** <notable implementation details>

## 🌟 Impact
- **UX**: <effect, or "None">
- **Performance**: <effect, or "None">
- **Security**: <effect, or "None">
- **Maintenance**: <effect, or "None">

## ℹ️ Additional Information
- **Breaking changes:** <what breaks and who must update, or "None">
- **Testing:** <exact command run and result, e.g. "pytest: 3 passed">
- **Setup:** <migrations, env vars, config, or "None">

## 💥 Issues
- <known limitation or pending concern, or "None known">

## 🏞️ Demo
<screenshots/GIF/video links, or "N/A — <reason, e.g. backend-only change>">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Slot rules:
- Type of Task: tick every box that applies (`[x]`), judged against the base branch.
- Breaking changes and test results go **only** in Additional Information.
- Issues lists only things you verified or can point to in the code.
- "None" is the answer for an Impact row with no real effect. One honest word beats a filler sentence.

## Reviewing a PR
1. `gh pr diff <n>` and `gh pr view <n>`; check out the branch and run the tests.
2. Confirm each suspected bug (run it, or cite the exact line) before calling it blocking.
3. Verdict: any Blocking item → `REQUEST_CHANGES`. Only non-blocking items → `COMMENT`. Nothing → `APPROVE`. On your own PR, GitHub rejects REQUEST_CHANGES/APPROVE; use `COMMENT`.
4. Post one review via `gh api repos/{owner}/{repo}/pulls/<n>/reviews --method POST --input -` carrying `event`, `body` and inline `comments` (path, line, side `RIGHT`), using ```` ```suggestion ```` blocks for one-line fixes.

Review body shape:
```markdown
<one-sentence overall assessment>

**Blocking**
1. **<problem>** (`file:line`) — evidence. Fix.

**Non-blocking**
- <problem> (`file:line`) — fix.
```
Omit an empty section. Never paste a discovered secret's value into a review or PR; refer to it by file and line.

## Common mistakes
| Mistake | Fix |
|---|---|
| Ticking "Bug fix" because a commit says "fix" | Compare against base |
| Test results scattered across sections | Additional Information → Testing only |
| Leaving template placeholder text | Replace with content or the stated fallback |
| Speculative Issues ("may not be thread-safe") | Only verified concerns |
