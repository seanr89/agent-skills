---
name: gdpr-privacy-ui
description: Use when designing, building, or reviewing GDPR, UK GDPR, or ePrivacy-facing UI in a web app - cookie banners, cookie consent or preferences modals, "Cookie settings" or "Privacy choices" links, privacy or "Privacy & Data" account settings, data export or download-my-data, account deletion or right to be forgotten, marketing opt-in checkboxes on sign-up or checkout, or consent records - including when asked to make "Accept" more prominent or to launch in the EU.
---

# GDPR Privacy UI

## Overview
Turn GDPR rights into concrete UI, state and endpoints. Agents already know the principles (no pre-ticked boxes, Reject as easy as Accept, scripts blocked until consent). What they drop are **whole required elements**: the cookie inventory, the visible consent history, the rectification form, the privacy link by the submit button, focus management in the modal. This skill makes each element a required slot.

This is engineering guidance, not legal advice. Anything that depends on a legal judgement goes in **Decisions for legal** (see Output); don't silently pick an answer.

## Ground rules
- Use the project's framework and component library. If none is evident, use React + TypeScript.
- Non-essential scripts and cookies load **only after** their category is granted. No exceptions for "anonymous" analytics, chat widgets, or `<noscript>` pixels.
- Accept, Reject and Customize share one visual style on the first layer. If asked to make Accept more prominent, decline that part, say why in one line (EDPB 03/2022, CNIL fines), and offer compliant ways to lift opt-in.
- Every optional consent defaults to off and is its own control: never bundled with Terms acceptance or with another purpose.
- Every consent change, wherever it happens (banner, modal, dashboard, sign-up, unsubscribe link), writes an append-only server-side record: purpose, granted, source, text version, timestamp. localStorage alone is not proof (Art. 7(1)).
- One `cookieRegistry` config drives both the modal's cookie accordion and the script gate, so the list shown to users can't drift from what loads.

## Required elements by surface
Build every element for each surface in scope. If the request covers only some surfaces, build those and name the rest under **Not covered**.

| Surface | Required elements |
|---|---|
| **Cookie banner** | Plain-language text + link to cookie policy; Accept all / Reject all non-essential / Customize settings, equal emphasis; non-modal (page stays usable); hidden once a valid choice is stored; re-shown when the consent version changes |
| **Preferences modal** | Real modal (`aria-modal`, focus trap, Esc, focus returns to opener); Strictly necessary shown on and locked; Analytics & performance, Functional, Targeting & advertising all default off; per-category accordion of cookies: provider, cookie name, purpose, retention; Save preferences + Accept all; draft seeded from the stored record when reopened |
| **Persistent control** | "Cookie settings" / "Privacy choices" on every page (footer or floating); reopens the modal; withdrawal stops scripts and clears their cookies (reload if needed) |
| **Privacy dashboard** | Rectification form (edit personal details inline, with validation); Download my data (JSON **and** CSV, async job with visible progress states: idle → queued → preparing → ready/failed, expiring link); Consent toggles per purpose, each with a visible read-only **history table** (purpose, status, date/time, source); Danger zone delete with irreversible-consequences warning and **re-authentication** (password, or 2FA code, or SSO re-auth for passwordless users) before execution |
| **Consent on forms** | Optional marketing checkbox unchecked by default, separate per purpose, not required to submit; privacy-policy link **adjacent to every submit button**, deep-linking to the relevant section; consent recorded with the text version shown |

## Output
Deliver these sections, in this order:

1. **Component hierarchy & state** - tree of components, then the consent state machine and data flow. Template: `references/components.md`.
2. **Markup** - JSX/HTML for each surface in scope. Template: `references/components.md`.
3. **Accessibility** - per-component WCAG 2.1 AA notes: keyboard, focus, ARIA, live regions, contrast. Read `references/accessibility.md` before writing this.
4. **Server contracts** - endpoints, consent-record schema, export and erasure jobs. Read `references/server.md`.
5. **Coverage checklist** - every row of the table above for in-scope surfaces, each marked done or explained.
6. **Decisions for legal** - open legal-basis questions, retention periods, erasure exceptions (Art. 17(3)), grace period, processors to notify.
7. **Not covered** - surfaces out of scope, if any.

When implementing in a real repo, the same sections become the PR description; the code is the markup.

## Verify before claiming done
- Fresh private window, DevTools Network: zero requests to tracker domains and no tracker cookies before choosing, after Reject, and after withdrawing.
- Keyboard only: reach the banner, open the modal, toggle a category, expand an accordion, save, and land back on the opener.
- Screen reader: switches announce name and state; export progress and save errors are announced.
- Server: every consent change above produced one consent-record row.

## Common mistakes
| Mistake | Fix |
|---|---|
| Preferences inline in the banner, no focus handling | Separate modal; see accessibility reference |
| Cookie details only on a `/cookies` page | Accordion in the modal, from `cookieRegistry` |
| Consent logged but no history shown | History table in the dashboard per purpose |
| Toggle saves a flag nothing reads | The consuming system (ESP, recommender) must read it; note the owner |
| Delete only hides the account | Real purge job, or ship "Request deletion" and say so |
| Password-only re-auth | Branch on the user's auth method |
