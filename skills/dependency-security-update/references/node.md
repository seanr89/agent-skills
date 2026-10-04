# Node.js reference

## Pick the package manager from the lockfile
| Lockfile | Manager | Install (frozen) |
|---|---|---|
| package-lock.json | npm | `npm ci` |
| yarn.lock (no .yarnrc.yml) | yarn classic | `yarn install --frozen-lockfile` |
| yarn.lock + .yarnrc.yml | yarn berry | `yarn install --immutable` |
| pnpm-lock.yaml | pnpm | `pnpm install --frozen-lockfile` |

Never mix managers. Respect `.nvmrc` / `engines`; warn if the active Node version differs.

## Audit
- npm: `npm audit --json` (use `--omit=dev` to see production-only risk, but report dev findings too)
- yarn classic: `yarn audit --json`
- yarn berry: `yarn npm audit --all --recursive --json`
- pnpm: `pnpm audit --json`

Outdated: `npm outdated`, `yarn outdated`, `pnpm outdated -r`.
Why is a package present: `npm explain <pkg>`, `yarn why <pkg>`, `pnpm why <pkg>`.

## Fix
Tier 1 (in-range):
- npm: `npm audit fix` (never `--force`)
- pnpm: `pnpm update <pkg>` (in range)
- yarn classic: `yarn upgrade <pkg>`; berry: `yarn up <pkg>`

Tier 2 (direct bump or override):
- Prefer bumping the direct parent that pulls in the vulnerable package.
- If the parent has no fix, pin the transitive version:
  - npm: `"overrides": { "vulnerable-pkg": "^x.y.z" }` in package.json
  - yarn: `"resolutions": { "vulnerable-pkg": "^x.y.z" }`
  - pnpm: `"pnpm": { "overrides": { "vulnerable-pkg": "^x.y.z" } }`
- JSON has no comments, so record each override and why in the commit message and the report, so it can be removed once the parent catches up.

## Monorepos / workspaces
Audit from the root (covers workspaces for npm/pnpm/yarn). Fix at the workspace that declares the dependency. Re-run build and tests for all affected workspaces.

## Gotchas
- Audit reports vulnerabilities in dev-only tooling that may not ship; still report them, flagged as dev-only.
- Lockfile format churn: if a different npm version rewrites the lockfile format, stop and tell the user rather than committing a huge diff.
- Private registries: auth lives in `.npmrc`; never print it.
