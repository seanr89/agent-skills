# Server contracts

Every endpoint is authenticated and scoped to the session user. Never accept a user id from the client. Rate-limit export and delete.

## Consent record (proof of consent, Art. 7(1))

```sql
CREATE TABLE consent_events (           -- append-only: never UPDATE or DELETE
  id            bigserial PRIMARY KEY,
  subject_id    text NOT NULL,          -- user id, or anonymous visitor id for cookie consent
  subject_kind  text NOT NULL CHECK (subject_kind IN ('user','visitor')),
  purpose       text NOT NULL,          -- 'cookies.analytics', 'email.marketing', 'recs.personalised'
  granted       boolean NOT NULL,
  source        text NOT NULL,          -- 'banner','prefs_modal','dashboard','signup','checkout','unsubscribe_link'
  text_version  text NOT NULL,          -- version of the wording the user saw (CONSENT_VERSION)
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON consent_events (subject_id, purpose, created_at DESC);
```

Current state = the latest row per `(subject_id, purpose)`; keep a denormalised column on `users` if reads are hot, but write both in one transaction. When a visitor signs up, link their visitor id to the user so cookie history follows them. Decide with legal whether to keep IP/user agent (it's more evidence, but it's also more personal data).

## Endpoints

| Endpoint | Behaviour |
|---|---|
| `POST /api/consent` | Body `{ visitorId?, choices, textVersion, source }`. Inserts one row per **changed** purpose. Called by the banner and modal on every save. |
| `GET /api/me/privacy` | `{ profile, consents, history, exportJob }`, so the dashboard loads in one call. `history` is newest first. |
| `PATCH /api/me/profile` | Rectification (Art. 16). Validate; an email change needs a confirmation link before it takes effect. Audit-log the change. |
| `PATCH /api/me/consents` | `{ [purpose]: boolean }`. Updates state, inserts `consent_events` (`source='dashboard'`), enqueues sync to the consuming system (ESP, ad platform, recommender) via an outbox so an outage can't drop it. |
| `POST /api/me/exports` | Body `{ format: 'json'\|'csv' }`. `202 { id, status: 'queued' }`. Returns the existing job if one is in flight. Export within one month at the latest (Art. 12(3)); aim for minutes. |
| `GET /api/me/exports/:id` | `{ status: 'queued'\|'preparing'\|'ready'\|'failed'\|'expired', percent?, expiresAt? }`. Polled or pushed (SSE) to drive progress UI. |
| `GET /api/me/exports/:id/download` | Owner check, then a 302 to a short-lived signed URL. Link expiry around 7 days. |
| `POST /api/me/reauth` | `{ password }`, `{ totp }`, or the SSO re-auth callback. Returns a single-use `reauthToken` valid for about 5 minutes. |
| `DELETE /api/me` | Requires `reauthToken`. Revokes all sessions immediately, unsubscribes from marketing, marks the account for erasure, enqueues the purge. `202`. |
| `POST /webhooks/esp/unsubscribe` | Signature-verified. Records `granted=false, source='unsubscribe_link'` so the dashboard matches the ESP. |

## Jobs

- **Export builder:** one registry of every table and store holding personal data (profile, activity, preferences, consent history, uploads). JSON = nested per entity; CSV = one file per entity, zipped. Add a test that fails when a table with a user-id column is missing from the registry.
- **Erasure purge:** uses the same registry. Hard-deletes, or anonymises where a legal retention duty applies (Art. 17(3): invoices, fraud records). Calls processor deletion APIs (ESP, analytics user-deletion, support desk, payment processor). Idempotent. The optional grace period is a legal/product decision; if there is one, sign-in stays blocked during it and support can cancel. Keep `consent_events` keyed by a pseudonymous id only if legal confirms it's needed as proof.
- **Withdrawal sync:** consent false -> stop processing in the consuming system, not just a stored flag.
