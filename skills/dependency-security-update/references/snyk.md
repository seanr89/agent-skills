# Snyk Open Source reference

## Availability check
1. `command -v snyk` (CLI installed?)
2. `SNYK_TOKEN` set, or `snyk auth` already done. The only reliable test is running a scan and checking for an auth error.
3. If the CLI is missing, tell the user it can be installed (`npm install -g snyk`) and ask before installing. Never ask the user to paste a token into chat; have them set `SNYK_TOKEN` in their own environment.
4. If Snyk is unavailable or fails on auth/network, fall back to native audits and say so in the report.

## Scan
- Whole repo (Node and .NET together): `snyk test --all-projects --json > snyk-results.json`
- Dev dependencies (Node): add `--dev`
- Focused first pass: `--severity-threshold=high`, but still report lower findings
- Exit codes: 0 = clean, 1 = vulnerabilities found, 2+ = error. Distinguish them.
- Do not commit `snyk-results.json`; summarize it in the report.

## Reading results
Per vulnerability use: `title`, `severity`, `packageName`, `version`, `from` (dependency path; length > 2 means transitive), `fixedIn`, `upgradePath`, `isUpgradable`, `isPatchable`, `identifiers.CVE`, `cvssScore`.
- `upgradePath` shows the direct bump that resolves a transitive issue; prefer it before overrides.
- Empty `fixedIn` means no fix available: use the "When no fix exists" process in SKILL.md.

## Policy and ignores
- Respect `.snyk`. Report ignored findings with reason and expiry; flag expired ignores.
- Never add ignores or run `snyk ignore` without user approval.

## Monitoring (optional)
`snyk monitor --all-projects` uploads a dependency snapshot to the Snyk dashboard. Only run with explicit user approval, since it sends project data to a third party.

## Reconcile with native tools
Compare Snyk and native findings by package and version. Different advisory databases and timing cause discrepancies. Do not drop a finding because only one tool reports it.
