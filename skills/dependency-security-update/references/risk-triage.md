# Risk triage: what is safe to bump

## Prioritize by
1. Severity (critical > high > medium > low), adjusted by:
2. Exposure: production vs dev/build-only; network-facing vs internal.
3. Exploitability: known exploit, exploit maturity, KEV/EPSS if available.
4. Reachability: is the vulnerable function actually used? Say "unverified" if unsure.

## Semver risk
| Change | Risk | Action |
|---|---|---|
| Patch (x.y.Z) | Low | Apply in Tier 1/2 |
| Minor (x.Y.0) | Low-medium | Apply; check release notes for deprecations |
| Major (X.0.0) | High | Tier 4: propose, list breaking changes, ask |
| 0.x versions | Minor may be breaking | Read the changelog |
| Pre-release | Avoid | Only if it is the sole fix, and ask |

## Before approving a major bump
- Read the changelog/migration guide; list breaking changes that touch this codebase.
- Check runtime requirements (Node engines, .NET target framework, peer dependencies).
- Search the codebase for usages of removed or renamed APIs.
- Estimate effort and suggest a separate branch/PR.

## Supply chain sanity checks
- Be suspicious of recently transferred packages, new maintainers, or a release right after a long gap.
- Do not add new dependencies to fix a vulnerability without telling the user.
- Double-check exact package names when adding references (typosquatting).
- Deprecated or abandoned packages: recommend a maintained replacement rather than only patching.
