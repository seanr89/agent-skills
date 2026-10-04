---
name: dependency-security-update
description: Audit and safely update dependencies for Node.js (npm, yarn, pnpm) and .NET (NuGet) projects, using Snyk Open Source when available and native audit tools otherwise. Make sure to use this skill whenever the user mentions vulnerabilities, CVEs, security advisories, npm audit, Snyk, Dependabot or Renovate alerts, outdated or deprecated packages, NuGet updates, upgrading dependencies, patching packages, or "make this repo secure", even if they don't explicitly ask for a "security update". Also use it for mixed repos containing both package.json and .csproj files.
---

# Dependency Security Update (Node + .NET)

Find vulnerable and outdated packages, fix them in risk-ordered tiers, and prove nothing broke.

## Ground rules

- Work on a branch. If on main/master, create `deps/security-update-YYYY-MM-DD` first.
- One commit per tier (see Step 4). Never mix security fixes and major upgrades in one commit.
- Never delete or regenerate lockfiles to "fix" things. Never run `npm audit fix --force`.
- Never print, log, or commit tokens (`SNYK_TOKEN`, NuGet feed credentials, `.npmrc` auth lines).
- Get explicit approval before: major version bumps, `snyk monitor`, changing target frameworks or Node engine versions.
- Do not override existing ignore policies (`.snyk`, `NuGetAuditSuppress`, audit-ci configs). Report them instead.

## Step 1: Detect

Run `scripts/detect.sh` from the repo root. It lists every `package.json`, lockfile, `*.csproj`/`*.sln`, `Directory.Packages.props`, `global.json`, and Snyk availability. If it can't run, do the same checks manually.

Then read the matching reference before running anything:
- Node found: `references/node.md`
- .NET found: `references/dotnet.md`
- Snyk available: `references/snyk.md`
- Deciding what is safe to bump: `references/risk-triage.md`

Mixed repos: handle each ecosystem separately but report together.

## Step 2: Baseline

Before changing anything, record that the project builds and tests pass:
- Node: install from lockfile (`npm ci` / `yarn install --immutable` / `pnpm install --frozen-lockfile`), then run the project's build and test scripts.
- .NET: `dotnet restore`, `dotnet build --no-restore`, `dotnet test --no-build`.

If the baseline is already failing, say so and ask whether to continue. Do not attribute pre-existing failures to your changes.

## Step 3: Audit

1. If Snyk is available (CLI present and authenticated), run it first. See `references/snyk.md`.
2. Always run the native audit too (`references/node.md`, `references/dotnet.md`). Compare results; flag findings that only one tool reports.
3. Include transitive dependencies. Most real findings are transitive.
4. Summarize before fixing: package, installed version, severity, direct or transitive, fixed-in version (or "no fix"), and which tool found it.

If neither Snyk nor network access is available, say so plainly. Audits need the advisory databases; do not claim a project is clean based on a failed scan.

## Step 4: Fix in tiers

Apply, verify (Step 5), and commit each tier separately:

1. **Tier 1: security patches within semver range.** Lockfile-only or patch/minor bumps that resolve a vulnerability.
2. **Tier 2: security fixes needing a direct bump or override.** Transitive vulnerabilities fixed through direct upgrade, `overrides`/`resolutions`, or NuGet direct reference / transitive pinning.
3. **Tier 3: other outdated packages, patch and minor only.** Optional. Do only if asked or clearly low risk.
4. **Tier 4: major upgrades.** Propose, don't apply. List breaking changes (changelog/release notes) and ask first.

For each major or risky bump, consult `references/risk-triage.md`.

## Step 5: Verify after every tier

- Reinstall from the lockfile, build, run tests.
- Re-run the audit(s) and confirm the targeted findings are gone and no new ones appeared.
- If something breaks, revert that tier's change, note why, and continue with the rest.

## Step 6: Report

Finish with a concise report:

- **Fixed:** package, old to new version, severity, how (patch, direct bump, override).
- **Remaining:** each unresolved finding with reason (no fix available, major bump needed, breaking change, false positive/not reachable) and a recommended action.
- **Needs a decision:** major upgrades, ignored findings, EOL packages.
- **Tools used:** Snyk and/or native audits; note anything that could not run.
- **Verification:** build and test results before and after.

## When no fix exists

Do not silently ignore. Check whether the vulnerable code path is actually used, look for a maintained replacement, and recommend either a documented, time-boxed ignore (with reason and expiry) or replacement. Only add ignores when the user approves.
