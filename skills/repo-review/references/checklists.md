# Sweep checklists

Check each item against the code in scope. Every item ends as a finding or a cleared line; skip items the stack cannot have (no SQL, no HTTP, no UI).

## Security

- **Injection**: user input reaching SQL, shell, `eval`, template, path, regex, or deserialisation sinks.
- **AuthN/AuthZ**: routes or handlers lacking auth checks; object access without ownership checks (IDOR); trust in client-supplied roles or ids.
- **Secrets**: keys, tokens, passwords, or connection strings in source, config, fixtures, or CI files; `.env` files tracked.
- **Web**: XSS sinks (`innerHTML`, `dangerouslySetInnerHTML`, unescaped templates), CSRF on state-changing routes, open redirects, permissive CORS, missing security headers, SSRF via user-supplied URLs.
- **Crypto**: weak hashes for passwords (MD5, SHA1, unsalted), hardcoded IVs or keys, `Math.random` or `Random` for tokens, disabled TLS verification.
- **Data exposure**: sensitive values in logs or error responses, verbose stack traces to clients, unrestricted file upload or download.
- **Dependencies**: manifests pinning known-vulnerable or abandoned packages. For a full dependency audit, point the user to the `dependency-security-update` skill.

## Bugs

- **Null and bounds**: unchecked nulls, `undefined` access, off-by-one, empty-collection assumptions.
- **Async and concurrency**: missing `await`, unhandled promise rejections, races on shared state, check-then-act, non-atomic updates.
- **Error handling**: swallowed exceptions, `catch` that continues in a bad state, errors lost across layers, wrong status codes.
- **Resources**: unclosed files, connections, streams, listeners, timers.
- **Logic**: inverted conditions, wrong operator, copy-paste divergence, timezone and locale assumptions, float money, integer overflow.
- **Contracts**: code that disagrees with its types, docs, or tests; tests that pass without asserting.

## Performance

- **Data access**: N+1 queries, queries inside loops, missing indexes for filtered columns, unbounded `SELECT`, no pagination.
- **Hot paths**: repeated work inside loops, quadratic scans on large collections, sync I/O on request threads, repeated parsing or serialisation.
- **Memory**: unbounded caches or queues, large payloads held in memory, leaks through retained listeners.
- **Network**: sequential calls that could run in parallel, missing timeouts, missing caching or batching.
- **Frontend**: oversized bundles, re-render storms, unoptimised images, blocking scripts.

## Tech debt

- **Structure**: god files and functions, circular dependencies, layers that leak, duplicated logic.
- **Dead weight**: unused exports, dead branches, stale feature flags, commented-out code, abandoned TODO/FIXME/HACK markers (list the oldest and riskiest).
- **Tests**: untested critical paths, flaky or skipped tests, mocks that replace the behaviour under test.
- **Tooling**: missing lint, type-check, or CI gates; mixed conventions; outdated runtimes or frameworks.
- **Docs and ops**: README that no longer runs, absent setup steps, missing config documentation.

## Features

- Stubbed or `NotImplemented` code, TODOs naming missing capability, endpoints missing a CRUD verb.
- Gaps in what the code already half-supports: configuration with no UI, events with no consumers, errors with no user-facing message.
- Cross-cutting capabilities absent from the stack: observability (logging, metrics, tracing), health checks, rate limiting, audit trail, accessibility, i18n, import/export.
- Developer experience: one-command setup, seed data, API docs, local mocks.
