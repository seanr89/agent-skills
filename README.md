# agent-skills

A collection of [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) for Claude Code. Each skill is a folder with a `SKILL.md` that tells Claude how to do one kind of task the same way every time: updating dependencies, opening pull requests, writing tests, and so on.

## Skills

| Skill | Use it to | Invocation |
|---|---|---|
| [`dependency-security-update`](skills/dependency-security-update/SKILL.md) | Audit and update vulnerable or outdated dependencies in Node.js (npm, yarn, pnpm) and .NET (NuGet) repos, using Snyk when available. Fixes in risk-ordered tiers, verifies after each. | Automatic |
| [`github-pull-requests`](skills/github-pull-requests/SKILL.md) | Create PRs with one fixed description template and post reviews in one fixed shape, via the `gh` CLI. | Automatic |
| [`openapi-docs`](skills/openapi-docs/SKILL.md) | Add or refresh OpenAPI docs, JSDoc comments, and swagger packages. **Written for one specific Express API** (`src/routes/*.js`, `Location`/`Offer` schemas); adapt it before using it on another project. | Manual only (`/openapi-docs`) |
| [`repo-review`](skills/repo-review/SKILL.md) | Scan a whole repo for security, bug, performance, tech-debt and feature findings and write a filterable `review.html` backlog. Needs Node.js to build the report. | Automatic |
| [`updating-repo-docs`](skills/updating-repo-docs/SKILL.md) | Before finishing work, check that `CLAUDE.md` and `README.md` still match the change, and report a `Docs:` line. | Automatic |
| [`writing-unit-tests`](skills/writing-unit-tests/SKILL.md) | Write, review and fix unit tests that assert behavior rather than implementation. | Automatic |

"Automatic" means Claude loads the skill when your request matches its `description`. You can also invoke any skill by name, for example `/repo-review`. `openapi-docs` sets `disable-model-invocation: true`, so Claude never loads it on its own; you must call it.

## Repository layout

```
skills/
  <skill-name>/
    SKILL.md          # required: frontmatter (name, description) + instructions
    references/       # optional: detail Claude reads only when a step needs it
    scripts/          # optional: helpers the skill runs
    assets/           # optional: templates and static files
```

The folder name must match the `name` in the skill's frontmatter.

## Adding these skills to Claude Code

Claude Code looks for skills in two places:

- **Personal:** `~/.claude/skills/<skill-name>/SKILL.md`, available in every project.
- **Project:** `<your-project>/.claude/skills/<skill-name>/SKILL.md`, available in that project and shareable by committing it.

Clone the repo first:

```bash
git clone https://github.com/seanr89/agent-skills.git
cd agent-skills
```

### Option 1: symlink (recommended)

Symlinks keep the installed skills in sync with the repo, so `git pull` updates them.

Install all skills for your user:

```bash
mkdir -p ~/.claude/skills
for dir in "$PWD"/skills/*/; do
  name=$(basename "$dir")
  if [ -e ~/.claude/skills/"$name" ]; then
    echo "skip $name: already exists in ~/.claude/skills"
  else
    ln -s "${dir%/}" ~/.claude/skills/"$name"
  fi
done
```

The loop skips any skill you already have installed so it never nests a link inside an existing folder. To replace one, delete or move the existing folder first.

Install one skill:

```bash
mkdir -p ~/.claude/skills
ln -s "$PWD/skills/writing-unit-tests" ~/.claude/skills/writing-unit-tests
```

Install into a single project instead, replacing `/path/to/project`:

```bash
mkdir -p /path/to/project/.claude/skills
ln -s "$PWD/skills/github-pull-requests" /path/to/project/.claude/skills/github-pull-requests
```

### Option 2: copy

Use this when you want a fixed snapshot, or a project copy that you commit:

```bash
mkdir -p ~/.claude/skills
cp -R skills/writing-unit-tests ~/.claude/skills/
```

Copies do not update when the repo changes. Re-copy to upgrade.

### Verify

Start a new Claude Code session (skills are discovered at startup), then ask Claude "What skills are available?" or type `/` and look for the skill names. Try a request that matches a description, such as "audit this repo's dependencies for vulnerabilities".

### Claude.ai and the desktop app

Skills can also be uploaded as zip files under **Settings → Capabilities → Skills**. Zip a single skill folder so the folder itself is at the root of the archive:

```bash
cd skills && zip -r writing-unit-tests.zip writing-unit-tests
```

Upload availability depends on your plan; check Anthropic's current docs.

## Per-skill requirements

| Skill | Needs |
|---|---|
| `dependency-security-update` | Your project's package manager (`npm`/`yarn`/`pnpm` or `dotnet`). The `snyk` CLI and `SNYK_TOKEN` are optional; without them it falls back to native audit tools. Audits need network access. |
| `github-pull-requests` | The [`gh` CLI](https://cli.github.com/), authenticated (`gh auth login`). |
| `openapi-docs` | An Express API laid out as the skill describes, plus `npm`. |
| `repo-review` | Node.js, to run `scripts/build-review.mjs`. |
| `updating-repo-docs`, `writing-unit-tests` | Nothing extra. |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add or change a skill.
