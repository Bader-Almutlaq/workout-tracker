# T-018: Publish the site and add it to the Home Screen

- **Milestone:** W0b
- **Depends on:** the owner choosing a host and creating a free account (agents can't create accounts)
- **Model tier:** strongest (lead)

## Goal

The app has a permanent HTTPS address. The owner opens it once in Safari, adds it to the Home Screen, and from then on it works offline and updates itself with a tap.

## Options (owner decides)

| Host | Code visibility | Notes |
|---|---|---|
| Cloudflare Pages | Private | Free. Deploy from the Mac with one command (`wrangler pages deploy dist`); no GitHub needed. |
| GitHub Pages | Public repository on the free plan | Free. Deploy by pushing; needs the GitHub CLI. |

Only the app's code is hosted. No training data is ever uploaded; the site has no server code.

## Scope

- **Create:** a `deploy` target in the `Makefile`, the host's config file if any, a *Hosting* section in `docs/DATA.md` (address, how to deploy, how to roll back).
- **Edit:** `README.md` (the address).

## Acceptance criteria

- [ ] `make deploy` publishes the current `main` build.
- [ ] Opened on the owner's iPhone, added to the Home Screen, works in airplane mode, and shows "Update ready" after a second deploy.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
