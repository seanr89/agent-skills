---
name: writing-unit-tests
description: Use when writing, reviewing, or fixing unit tests, adding tests for new code or a bug fix, or when tests break on refactors, run slowly, flake, or are mostly mocks.
---

# Writing Unit Tests

## Overview
A unit test is an executable spec of **observable behavior**. It fails when behavior is wrong and only then. A test that fails on a harmless refactor, or passes on broken code, is worse than no test.

## Contract for every test
- **Name** states the behavior in domain terms: `rejects_order_when_stock_is_insufficient`, not `test_validate` or `calls_repository_save`.
- **Shape** is Arrange / Act / Assert, one Act, one reason to fail.
- **Asserts** only on what a caller or user can observe: return values, resulting state read through the public API, and side effects that cross a boundary (message sent, row written).
- **Fails first.** Before trusting a new test, break the code on purpose (flip a condition, drop a line) and watch it fail. For a bug fix, write the test that reproduces the bug before the fix.

## Meaningful: behavior, not implementation
Ask of each test: *if I rewrote the internals and kept the behavior, would this still pass?* If no, it is coupled to implementation.

- Test through the public interface. Never test private methods, never expose members "for testing".
- Don't assert call counts, call order, or internal collaborator calls. Verify an interaction only when the interaction **is** the behavior (an email is sent).
- No assertion-free tests, no asserting a mock returns what you stubbed, no copying the production formula into the expectation.

```ts
// Coupled: breaks if pricing is split into helpers; proves nothing about the total
expect(calc.applyDiscount).toHaveBeenCalledWith(cart, 0.1);

// Behavior: survives any refactor, fails if the total is wrong
const total = checkout(cartWith({ price: 100, qty: 2 }), { coupon: "TEN_PERCENT" });
expect(total).toBe(180);
```

## Fast
Each test runs in milliseconds with no network, real DB, filesystem, `sleep`, or real clock.
- Replace only **process boundaries** (HTTP, DB, filesystem, clock, randomness) with in-memory fakes. Inject the clock; never sleep.
- Prefer a hand-written fake over a mock with scripted calls. Keep real in-process collaborators real.
- Anything needing real I/O is an integration test: keep it in a separate suite.

## Maintainable
- Test data via builders/factories that set only the fields the test cares about, so the relevant input is visible.
- No loops, conditionals, or computed expectations in tests. Use literals; use parameterized cases for variations.
- Tests are independent and order-free: no shared mutable state, each builds its own world.
- Duplicate setup is fine; hide it in a helper only when the helper's name explains it.

## Smells and fixes
| Smell | Fix |
|---|---|
| Test breaks on rename/extract with no behavior change | Assert outputs through the public API |
| Many mocks, little assertion | Fake the boundary; assert on result/state |
| Passes when logic is deleted | Weak assertion; apply the break-it check |
| Flaky / slow | Find the real clock, sleep, network, or shared state; inject or remove it |
| 40-line Arrange | Builder with defaults; split the class if still huge |
| Name says "and" / multiple Acts | Split into one test per behavior |

## When existing tests fail after your change
Decide first: **did observable behavior change on purpose?**
- No: the test was coupled to internals. Rewrite the test to assert behavior; do not bend production code to satisfy it.
- Yes: update the test deliberately and say so in your report.
- Never weaken, skip, or delete an assertion just to get green.
