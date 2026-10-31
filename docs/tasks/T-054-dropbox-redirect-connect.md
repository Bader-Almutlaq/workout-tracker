# T-054: Connect Dropbox without copying a code

- **Milestone:** R11 (automatic backup) · **Depends on:** T-052 (merged) · **Model tier:** strong (Codex Sol: OAuth redirect handling)

## Goal

On the iPhone, the code Dropbox shows after **Allow** is hard to select and copy. Use Dropbox's redirect instead: after **Allow**, Dropbox sends the owner straight back to JEM, which finishes connecting by itself. The copy-code flow stays as a fallback.

The owner registers this redirect URI in the Dropbox App Console (lead will give them the steps):

`https://bader-almutlaq.github.io/workout-tracker/settings`

## Read first

- `AGENTS.md`; `docs/DECISIONS.md` (Dropbox entries, including T-052's pending verifier).
- `src/app/data/dropbox/` (`DropboxBackup.ts`, `DropboxApi.ts` `exchange`, `pkce.ts` `authorizationUrl`, `DropboxTokenStore.ts` pending verifier, `cloudBackup.ts`), `src/app/features/settings/DropboxBackupSection.tsx` and the code form; their tests.
- Dropbox OAuth guide (PKCE with `redirect_uri`, `state`): the `/oauth2/authorize` and `/oauth2/token` parameters. The `redirect_uri` sent to the token endpoint must equal the one sent to authorize.

## Scope

- **May edit:** the files above, their tests, `docs/DATA.md`, `docs/DECISIONS.md` (one entry).
- **Do not touch:** backup contents, retention, the worker, routes other than reading query parameters on `/settings`.

## Specification

1. **Redirect URI** = the app's own `/settings` URL, built from `import.meta.env.BASE_URL` and `location.origin`, never hard-coded. It works on GitHub Pages and on a local dev server (where it simply won't be registered).
2. **Open Dropbox (redirect):**
   - Create the verifier and a random `state` (from `crypto.getRandomValues`).
   - Store both with the pending entry (extend T-052's record: verifier, state, appKey, createdAt; same 10-minute expiry).
   - Navigate **the same window** (`location.assign`) to the authorize URL with `redirect_uri` and `state`. No popup: on an iPhone Home Screen app, same-window navigation keeps the app's storage, while a popup opens separate Safari storage.
3. **Coming back:** when `/settings` loads with `code` and `state` (or `error`) in the query:
   - Immediately remove them from the address bar (`history.replaceState`), so a reload never reuses a code.
   - Then:
     - **State matches the stored pending entry:** exchange with the same `redirect_uri`, then run the existing success path (first backup and the "Connected. First backup saved…" notice).
     - **State missing or different:** "That Dropbox reply didn't match this phone. Tap Open Dropbox again."
     - **Expired:** the T-052 expiry message.
     - **`error=access_denied`:** "Dropbox access wasn't allowed."
   - Never log the code, state or verifier.
4. **Fallback:**
   - Under step 1, a quiet link **Paste a code instead** switches to today's popup and copy-code steps, without `redirect_uri`, exactly as T-052 built them.
   - The Advanced (own app key) text adds: "Add this redirect URI in your app's settings: <the URI>", with the URI selectable.
5. **Wording:** step 1 becomes "Open Dropbox and tap **Allow**. You'll come straight back here." Step 2 (paste) shows only in the fallback.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests:
  - the authorize URL contains `redirect_uri` and `state`
  - the pending entry stores state
  - a return with matching state exchanges once with the same `redirect_uri`, uploads once and clears the query
  - mismatched/missing state, expired entry and `access_denied` give their messages and exchange nothing
  - a reload after success doesn't exchange again
  - the fallback flow still sends no `redirect_uri`
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

- Implemented same-window redirect authorization, state-bound pending grants, immediate Settings query removal, one-time exchange with the exact redirect URI, shared first-backup success feedback, and the popup/copy-code fallback. Advanced setup displays a selectable deployment-specific URI.
- Files: `src/app/data/dropbox/{DropboxBackup,DropboxApi,DropboxTokenStore,pkce,cloudBackup}.ts`; tests in `DropboxBackup.test.ts`, `DropboxTokenStore.test.ts`, `pkce.test.ts`, `cloudBackup.test.ts`; `src/app/features/settings/{DropboxBackupSection.tsx,DropboxBackupSection.module.css,DropboxBackupSection.test.ts,DropboxAppKeyForm.tsx}`; `docs/DATA.md`, one entry in `docs/DECISIONS.md`, and this Handoff. No task-board changes; changes remain uncommitted.
- Public API: `DropboxBackup.beginRedirectConnect(redirectUri, navigate)` and `handleRedirect(redirectUri, currentUrl, replace)`; `createState()` and `settingsRedirectUri(origin, baseUrl)`; `authorizationUrl` accepts optional `{ redirectUri, state }`; `DropboxApi.exchange` accepts an optional redirect URI. `writePendingVerifier` accepts optional state; `readPendingAuthorization` returns `PendingDropboxAuthorization`; `readPendingVerifier` now exposes copy-code grants only. `cloudBackup.ts` exports the shared `dropboxRedirectUri`.
- Interpretations: legacy pending records without state remain valid for fallback only. Redirect grants cannot be pasted through the fallback exchange. Expired redirect replies reuse T-052's exact existing message (“Tap Open Dropbox first, then paste the new code.”), despite its paste wording. Denial shows the specified denial message even without returned state; it never exchanges. Other provider errors show fixed feedback without exposing provider details. Unrelated query parameters and hashes are preserved.
- Startup regression: initialization does not immediately retry a failed callback upload and hide its error. The pending retry remains available through the existing retry paths.
- Verification: `make format` and `make verify` pass: 1,054 tests across 136 files, strict type checks, lint and production/PWA build. `git diff --check` passes. One full run hit the existing search timing assertion (8.0 ms against 5 ms); it passed in other runs without search changes. The build reports its existing large-chunk warning.
- Still needs live review: register `https://bader-almutlaq.github.io/workout-tracker/settings` in the Dropbox App Console, then check the Home Screen redirect/storage round trip and dark/light layout at 430 × 932 on the iPhone. Visual checking could not run here: `make dev` failed with `listen EPERM` on port 5173, and the browser host was unavailable. No live account authorization was attempted.
