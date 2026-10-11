# Accessibility (WCAG 2.1 AA)

Cite the success criterion next to each note in the output so reviewers can check it.

## Per component

| Component | Keyboard & focus | ARIA / semantics | WCAG |
|---|---|---|---|
| **Cookie banner** | First in DOM order, so Tab reaches it first. **Not** a focus trap: the page stays usable. Don't steal focus on load. Visible focus ring on all buttons. | `<section aria-labelledby>` (a labelled region). Not `role="dialog"`: it isn't modal. Buttons are `<button>`, not links or divs. | 2.1.1, 2.4.3, 2.4.7, 4.1.2 |
| **Preferences modal** | On open: focus the heading (`tabIndex={-1}`) or the first switch. Tab and Shift+Tab cycle inside. Esc closes **without saving**. On close: focus returns to whichever control opened it (banner button, footer link, dashboard link). If that control no longer exists (the banner hid after saving), focus the footer "Privacy choices" control. Background is inert. | Native `<dialog>` + `showModal()` gives trap, Esc and inert for free. Otherwise `role="dialog" aria-modal="true" aria-labelledby aria-describedby` plus a manual trap and `inert` on siblings. The close button has `aria-label="Close without saving"`. | 2.1.2, 2.4.3, 4.1.2 |
| **Category switch** | Space/Enter toggles. Toggling never moves focus. | `role="switch"` + `aria-checked`, named by the category label (`aria-labelledby`), described by its explanation (`aria-describedby`). Visible state text, not colour alone. | 1.4.1, 4.1.2, 2.5.3 |
| **Locked "Strictly necessary"** | Stays focusable so screen-reader users discover it; activation does nothing. | `aria-checked="true" aria-disabled="true"` plus visible "Always active" text that's in the accessible description. Avoid plain `disabled`: it drops out of the tab order. | 4.1.2, 1.3.1 |
| **Cookie accordion** | Enter/Space on the header button toggles. Focus stays on the button. | `<button aria-expanded aria-controls>` inside a heading; the panel uses `hidden` when collapsed. Table has `<caption>`, `<th scope="col">`, provider as `<th scope="row">`. | 1.3.1, 4.1.2 |
| **Footer "Privacy choices"** | Reachable on every page in a consistent location. | A `<button>`, because it opens a dialog rather than navigating. | 3.2.3, 4.1.2 |
| **Rectification form** | Errors on submit move focus to an error summary or the first invalid field. | Every input has a `<label>`; `autoComplete` tokens (`name`, `email`, `tel`, `street-address`); `aria-invalid` + `aria-describedby` to the error text. Save result in `role="status"`. | 1.3.5, 3.3.1, 3.3.2, 4.1.3 |
| **Data export** | Button stays focusable while busy, or move focus to the status text. | Progress in `role="status"` (polite): "Preparing your file…", "Ready". Failures in `role="alert"`. `<progress>` has an accessible name. | 4.1.3 |
| **Consent switches (dashboard)** | As category switch. A pending save sets `aria-busy`. | Save errors and rollbacks announced in `role="alert"`. | 4.1.3 |
| **Consent history table** | Plain read-only table; no interactive rows. | `<th scope="col">`, `<time dateTime>`, a heading or `aria-labelledby` as its name. Status as text ("Opted in"), never an icon alone. | 1.3.1, 1.4.1 |
| **Delete dialog** | Initial focus on **Cancel** (the safe action). Esc cancels. Focus returns to the delete button on cancel. On success, navigate and focus the confirmation page heading. | As modal. The warning list is in `aria-describedby`. Re-auth input labelled; errors in `role="alert"`. | 2.4.3, 3.3.1, 3.3.4 |
| **Form opt-in checkbox** | Native checkbox; label clickable. | `<label for>`; group optional consents in `<fieldset><legend>`. The privacy link text says where it goes ("Privacy Policy", not "here"). | 1.3.1, 2.4.4, 3.3.2 |

## Visual

- Text contrast at least 4.5:1 (1.4.3). Switch tracks, focus rings and button borders at least 3:1 against their surroundings (1.4.11).
- Reject, Customize and Accept: same size, weight, colour and contrast. Equal emphasis is both a GDPR requirement and a usability one.
- Banner and modal reflow at 320 CSS px without horizontal scrolling (1.4.10). Text resizes to 200% without clipping (1.4.4).
- The banner never covers the focused element (avoid fixed overlays hiding the footer link). Hit targets of at least 24×24 px are good practice (WCAG 2.2's 2.5.8).
- Respect `prefers-reduced-motion` for banner slide-ins and accordion animation (2.3.3 is AAA, but it's cheap).

## Test steps

1. Keyboard only, fresh session: Tab into the banner, open Customize, toggle Analytics, expand its accordion, Save. Focus should land back on the opener.
2. Esc in the modal discards the draft and restores focus.
3. Screen reader (VoiceOver or NVDA): each switch reads "<Category>, switch, off". Locked reads as on and dimmed/unavailable with "Always active". Export progress and consent save errors are announced without moving focus.
4. Zoom to 400% / 320 px width: no horizontal scroll, no hidden buttons.
