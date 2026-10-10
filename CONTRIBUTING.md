# Contributing

Thanks for improving these skills. This guide covers adding a new skill, changing an existing one, and what a pull request needs.

## Skill anatomy

Every skill lives in `skills/<skill-name>/`:

```
skills/<skill-name>/
  SKILL.md          # required
  references/       # optional: longer detail, loaded only when a step points to it
  scripts/          # optional: executable helpers
  assets/           # optional: templates and static files
```

`SKILL.md` starts with YAML frontmatter:

```markdown
---
name: skill-name
description: Use when <triggering conditions>.
---

# Skill Name
...
```

| Field | Rules |
|---|---|
| `name` | Lowercase letters, digits and hyphens. Must match the folder name. Prefer a verb phrase or topic (`writing-unit-tests`, `repo-review`). |
| `description` | Says **when to use** the skill, not what the steps are. Claude reads only this to decide whether to load the skill, so name the situations and the phrases a user would say. Start with "Use when". |
| `disable-model-invocation` | Optional. Set to `true` for skills that should only run when the user calls them by name (see `openapi-docs`). |

## Writing a good skill

Follow the conventions the existing skills share:

- **Be specific and checkable.** Prefer rules Claude can verify ("tests pass", "`npm run openapi:check` exits 0") over advice ("write good docs"). Multi-step skills give each step a completion criterion, as `openapi-docs` and `repo-review` do.
- **Keep `SKILL.md` short.** Put long checklists, per-ecosystem detail and examples in `references/` and tell Claude exactly when to read each file ("Node found: `references/node.md`").
- **State the guardrails.** Say what Claude must never do (force flags, deleting lockfiles, printing tokens) and what needs the user's approval first.
- **Define the output.** If the skill ends in a report, PR body or file, give its exact shape.
- **Don't duplicate other skills.** Point to them instead, as `repo-review` points to `dependency-security-update` for full dependency audits.
- **Scope honestly.** If a skill only fits one project's layout, say so in its description and in the README table.
- **Scripts:** use paths relative to the skill folder, mark them executable (`chmod +x`), print usage on bad input, and never write secrets to output. Avoid dependencies beyond a stock shell or Node.js unless the README's requirements table lists them.

## Adding a skill

1. Create `skills/<skill-name>/SKILL.md` with the frontmatter above.
2. Add any `references/`, `scripts/` and `assets/` it needs.
3. Add a row to the **Skills** table and, if it needs tools beyond Claude Code, to **Per-skill requirements** in [README.md](README.md).
4. Test it (below).
5. Open a pull request.

## Changing a skill

- Keep `name` and the folder name in sync; renaming a skill breaks existing installs, so call it out in the PR.
- If you change behavior, update the matching row in the README and any `references/` file that repeats it.
- Run through the skill again after editing (below). Instructions that read well can still send Claude down the wrong path.

## Testing a skill

There is no automated test suite, so test by using the skill:

1. Install your working copy by symlink (see [README.md](README.md#option-1-symlink-recommended)) so edits apply immediately.
2. Start a fresh Claude Code session in a scratch project that fits the skill.
3. **Trigger test:** ask for the task in natural words, without naming the skill. Confirm Claude loads it. Then try a near-miss request and confirm it does *not* load.
4. **Behavior test:** run the full workflow and check each completion criterion and guardrail held. Try the failure paths too (failing baseline, missing tool, no network).
5. For scripts, run them directly:
   ```bash
   bash skills/dependency-security-update/scripts/detect.sh /path/to/repo
   node skills/repo-review/scripts/build-review.mjs findings.json review.html
   ```

Note in your PR what you ran and what happened.

## Pull requests

- Branch from `main`; one skill or one focused change per PR.
- Commit messages: short, imperative, in the style of the history (`Add repo-review skill`, `Add OpenAPI export step to openapi-docs skill`).
- Write the PR description with the structure in `skills/github-pull-requests/SKILL.md`.
- Don't commit secrets, tokens, generated output (such as `review.html`), or machine-specific paths.

## Reporting problems

Open an issue with the skill name, the request you gave Claude, what it did, and what you expected.
