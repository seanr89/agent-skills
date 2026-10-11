# Components, state and markup

Templates to adapt, not paste. Rename to the project's conventions and swap in its own `Modal`, `Button` and form components where they already meet the accessibility reference.

## Component hierarchy

```
<ConsentProvider>                 consent record, modal open state, opener ref, save/withdraw
├─ <ScriptGate>                   mounts vendor scripts per granted category (reads cookieRegistry)
├─ <CookieBanner>                 non-modal, first in DOM order; shown when record is null/stale
├─ <PreferencesModal>             modal; draft choices; category toggles + cookie accordions
│   └─ <CategoryPanel> ×4         switch + accordion -> <CookieTable>
├─ <PrivacyChoicesLink>           in footer on every page; opens modal, passes itself as opener
└─ app routes
    ├─ /account/privacy  <PrivacyDashboard>
    │   ├─ <PersonalDetailsForm>  rectification
    │   ├─ <DataExportPanel>      async job status
    │   ├─ <ConsentPanel>
    │   │   ├─ <ConsentSwitch> ×n per processing purpose
    │   │   └─ <ConsentHistoryTable>
    │   └─ <DangerZone> -> <DeleteAccountDialog> (re-auth step)
    └─ forms: <SignupForm>, <CheckoutForm>, <ContactForm>
        ├─ <OptionalConsentCheckbox> ×n per purpose
        └─ <SubmitWithPrivacyNotice>
```

## Single source of truth: the cookie registry

```ts
export type Category = 'necessary' | 'analytics' | 'functional' | 'advertising';

export interface CookieEntry {
  category: Category;
  provider: string;        // "Google Analytics 4"
  names: string[];         // ["_ga", "_ga_*"]
  purpose: string;         // plain language, user-facing
  retention: string;       // "13 months", "Session"
  policyUrl?: string;      // vendor privacy policy
  storageKeys?: string[];  // vendor localStorage/sessionStorage keys to clear on withdrawal ("_hj*")
  load?: () => void;       // script loader; absent for necessary/first-party cookies
  onWithdraw?: () => void; // vendor shutdown API, e.g. Intercom('shutdown')
}

export const CONSENT_VERSION = 3;  // bump when vendors or purposes change -> everyone is re-asked
export const cookieRegistry: CookieEntry[] = [ /* one entry per vendor */ ];
```

The modal renders the accordion from this array and `ScriptGate` calls `load()` from it, so the two can't disagree.

## Consent state machine

```
             ┌──────────── version changed / record expired ───────────┐
             v                                                          │
 loading ──> undecided ──ACCEPT_ALL / REJECT_ALL / SAVE(draft)──> decided
  (SSR,         │                                                  │   ^
  nothing       └──OPEN_PREFS──> prefsOpen ──SAVE / ACCEPT_ALL─────┘   │
  rendered)                         ^  │ ESC / CLOSE (no change)       │
                                    │  v                               │
                    decided ──OPEN_PREFS (footer link, dashboard)──────┘
```

- `loading`: record not read yet. Render no banner and load no scripts (avoids a hydration flash and pre-consent loads).
- `prefsOpen` keeps a **draft**: seeded from the stored record, or all non-essential `false` if none. Nothing is applied until Save / Accept all.
- On every transition into `decided`: write the local record `{choices, version, ts}`, POST it to the consent log (`references/server.md`), close the modal, return focus to the opener.
- **Opener gone:** the banner unmounts once a choice is saved, taking its Customize button with it. If `openerRef.current?.isConnected` is false, focus the footer "Privacy choices" control instead (give it a stable `id`).
- **Withdrawal** (any category goes true -> false): call each entry's `onWithdraw`, delete that category's cookies (`names`, matching `*`, on every parent domain) and `storageKeys`, then reload so already-executed scripts stop. Third-party cookies on the vendor's own domain (for example Meta's `fr`) can't be deleted; say so in the output.

```ts
type Choices = Record<Exclude<Category, 'necessary'>, boolean>;
type State =
  | { status: 'loading' }
  | { status: 'undecided' }
  | { status: 'decided'; record: { choices: Choices; version: number; ts: number } };
// UI state alongside: prefsOpen: boolean, draft: Choices, openerRef: RefObject<HTMLElement>
```

## Cookie banner

```tsx
// Render as the first child of <body> so keyboard and screen-reader users reach it first.
<section className="cookie-banner" aria-labelledby="cb-title" aria-describedby="cb-desc">
  <h2 id="cb-title">Your privacy choices</h2>
  <p id="cb-desc">
    We use cookies that are needed to run the site. With your permission we'd also use
    cookies for analytics, extra features and advertising. They stay off unless you allow them,
    and you can change your choice any time via "Privacy choices" in the footer.{' '}
    <a href="/privacy#cookies">Read our cookie policy</a>
  </p>
  <div className="cookie-banner__actions">
    {/* identical variant for all three: same size, colour, weight, order is not a hierarchy */}
    <Button variant="neutral" onClick={rejectAll}>Reject all non-essential</Button>
    <Button variant="neutral" onClick={(e) => openPrefs(e.currentTarget)}>Customize settings</Button>
    <Button variant="neutral" onClick={acceptAll}>Accept all</Button>
  </div>
</section>
```

## Preferences modal

```tsx
<dialog ref={dialogRef} aria-labelledby="pm-title" aria-describedby="pm-desc" onCancel={closeWithoutSaving}>
  {/* open with dialogRef.current.showModal(): native focus trap, Esc, inert background */}
  <h2 id="pm-title">Cookie preferences</h2>
  <p id="pm-desc">Choose which optional cookies we may use. Strictly necessary cookies are always on.</p>

  {CATEGORIES.map((cat) => (
    <section key={cat.id} className="category" aria-labelledby={`cat-${cat.id}-label`}>
      <div className="category__header">
        <span id={`cat-${cat.id}-label`} className="category__label">{cat.label}</span>
        <p id={`cat-${cat.id}-desc`}>{cat.description}</p>
        {cat.id === 'necessary' ? (
          <button type="button" role="switch" aria-checked="true" aria-disabled="true"
                  aria-labelledby={`cat-${cat.id}-label`} aria-describedby={`cat-${cat.id}-desc cat-${cat.id}-locked`}>
            <span id={`cat-${cat.id}-locked`}>Always active</span>
          </button>
        ) : (
          <button type="button" role="switch" aria-checked={draft[cat.id]}
                  aria-labelledby={`cat-${cat.id}-label`} aria-describedby={`cat-${cat.id}-desc`}
                  onClick={() => toggle(cat.id)}>
            <span aria-hidden="true">{draft[cat.id] ? 'On' : 'Off'}</span>
          </button>
        )}
      </div>

      <h3>
        <button type="button" aria-expanded={expanded[cat.id]} aria-controls={`cat-${cat.id}-cookies`}
                onClick={() => toggleExpanded(cat.id)}>
          View {cat.label.toLowerCase()} cookies ({entriesFor(cat.id).length})
        </button>
      </h3>
      <div id={`cat-${cat.id}-cookies`} hidden={!expanded[cat.id]}>
        <table>
          <caption className="visually-hidden">{cat.label} cookies</caption>
          <thead><tr><th scope="col">Provider</th><th scope="col">Cookie</th><th scope="col">Purpose</th><th scope="col">Retention</th></tr></thead>
          <tbody>
            {entriesFor(cat.id).map((e) => (
              <tr key={e.provider}>
                <th scope="row">{e.policyUrl ? <a href={e.policyUrl}>{e.provider}</a> : e.provider}</th>
                <td><code>{e.names.join(', ')}</code></td>
                <td>{e.purpose}</td>
                <td>{e.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  ))}

  <div className="modal__actions">
    <Button variant="neutral" onClick={savePreferences}>Save preferences</Button>
    <Button variant="neutral" onClick={acceptAll}>Accept all</Button>
  </div>
  <button type="button" className="modal__close" aria-label="Close without saving" onClick={closeWithoutSaving}>×</button>
</dialog>
```

## Persistent control

```tsx
<footer>
  {/* ...other links */}
  <button type="button" className="link-button" onClick={(e) => openPrefs(e.currentTarget)}>
    Privacy choices
  </button>
</footer>
```

## Privacy dashboard

```tsx
<main aria-labelledby="privacy-title">
  <h1 id="privacy-title">Privacy &amp; data</h1>

  <section aria-labelledby="details-title">
    <h2 id="details-title">Your details</h2>
    <form onSubmit={saveDetails} noValidate>
      <label htmlFor="name">Full name</label>
      <input id="name" name="name" autoComplete="name" defaultValue={user.name}
             aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} />
      {errors.name && <p id="name-err" className="error">{errors.name}</p>}
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" defaultValue={user.email}
             aria-describedby="email-hint" />
      <p id="email-hint">We'll ask you to confirm a new address before it's used.</p>
      {/* ...other personal fields the app stores */}
      <Button type="submit">Save changes</Button>
      <p role="status">{saveStatus /* "Saved" | "" */}</p>
    </form>
  </section>

  {/* const busy = job.status === 'queued' || job.status === 'preparing'; */}
  <section aria-labelledby="export-title">
    <h2 id="export-title">Download your data</h2>
    <p>A copy of your profile, activity and preferences, as JSON (machine-readable) and CSV (spreadsheet).</p>
    <fieldset>
      <legend>Format</legend>
      <label><input type="radio" name="fmt" value="json" checked={format === 'json'} onChange={() => setFormat('json')} /> JSON</label>
      <label><input type="radio" name="fmt" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} /> CSV</label>
    </fieldset>
    {/* aria-disabled, not disabled: stays focusable while busy; guard in the handler */}
    <Button aria-disabled={busy} onClick={() => { if (!busy) requestExport(format); }}>
      Download my personal data
    </Button>
    {busy && (
      <progress aria-label="Export progress" value={job.percent ?? undefined} max={100} />
    )}
    <p role="status">{exportMessage(job) /* "Preparing your file…" | "Ready: link expires 18 Oct" */}</p>
    {job.status === 'ready' && <a href={job.downloadUrl} download>Download file</a>}
    {job.status === 'failed' && <p role="alert">Your export failed. Try again.</p>}
  </section>

  <section aria-labelledby="consent-title">
    <h2 id="consent-title">Your consents</h2>
    {purposes.map((p) => (
      <ConsentSwitch key={p.id} purpose={p} checked={p.granted} pending={pending[p.id]} onChange={setConsent} />
    ))}
    <p role="status">{consentSaveMessage}</p>

    <h3 id="history-title">Consent history</h3>
    <table aria-labelledby="history-title">
      <thead><tr><th scope="col">Purpose</th><th scope="col">Status</th><th scope="col">Date and time</th><th scope="col">Where</th></tr></thead>
      <tbody>
        {history.map((h) => (
          <tr key={h.id}>
            <td>{h.purposeLabel}</td>
            <td>{h.granted ? 'Opted in' : 'Opted out'}</td>
            <td><time dateTime={h.createdAt}>{formatDateTime(h.createdAt)}</time></td>
            <td>{h.sourceLabel /* Sign-up, Settings, Cookie banner, Email unsubscribe */}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>

  <section aria-labelledby="danger-title" className="danger-zone">
    <h2 id="danger-title">Delete account</h2>
    <p>Permanently deletes your account and personal data. This can't be undone.</p>
    <Button variant="danger" onClick={(e) => openDelete(e.currentTarget)}>Delete my account &amp; personal data</Button>
  </section>
</main>
```

### Delete dialog (two steps)

```tsx
<dialog ref={deleteRef} aria-labelledby="del-title" aria-describedby="del-desc">
  <h2 id="del-title">Delete your account?</h2>
  {step === 'warn' && (<>
    <div id="del-desc">
      <p>This will permanently delete:</p>
      <ul><li>Your profile and login</li><li>Your activity history</li><li>Your saved preferences</li></ul>
      <p>We keep only what the law requires (for example invoices), anonymised where possible.</p>
    </div>
    <Button onClick={close} autoFocus>Cancel</Button>   {/* initial focus on the safe action */}
    <Button variant="danger" onClick={() => setStep('reauth')}>Continue</Button>
  </>)}
  {step === 'reauth' && (
    <form onSubmit={confirmDelete}>
      {authMethod === 'password' && (<><label htmlFor="del-pw">Current password</label>
        <input id="del-pw" type="password" autoComplete="current-password" required /></>)}
      {authMethod === 'totp' && (<><label htmlFor="del-otp">6-digit code from your authenticator app</label>
        <input id="del-otp" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" required /></>)}
      {authMethod === 'sso' && <Button onClick={reauthWithProvider}>Confirm with {providerName}</Button>}
      {error && <p role="alert">{error}</p>}
      <Button onClick={close}>Cancel</Button>
      <Button type="submit" variant="danger">Delete permanently</Button>
    </form>
  )}
</dialog>
```

## Consent on forms

```tsx
<fieldset>
  <legend>Optional</legend>
  {/* one checkbox per purpose; unchecked initial state; never `required` */}
  <input id="optin-news" type="checkbox" name="consent.product_news" defaultChecked={false} />
  <label htmlFor="optin-news">Email me product news and offers. Unsubscribe any time.</label>
</fieldset>

<div className="submit-row">
  <Button type="submit">Create account</Button>
  <p className="submit-notice">
    By creating an account you agree to our <a href="/terms">Terms</a>. See how we use your
    data in our <a href="/privacy#account-data">Privacy Policy</a>.
  </p>
</div>
```

Send the consent text version with the submission so the server can record exactly what the user saw.
