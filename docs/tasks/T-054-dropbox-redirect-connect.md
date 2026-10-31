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

_Filled in by the implementer when stopping or finishing._
