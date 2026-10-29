# Free ways to keep a self-built iOS app installed permanently (no $99/yr), as of Oct 2026 — user in Saudi Arabia (non-EU)

Research date: 2026-10-29. Note: EU-only routes (AltStore PAL, alternative marketplaces) do not apply to a Saudi user.

## 1. Free Apple ID "Personal Team" signing in Xcode — lifetime, limits, capabilities, data

### Takeaway
Free provisioning still works in 2026 but every install expires 7 days after signing; limits are 3 apps per device, 3 devices, and 10 App IDs per rolling 7 days. Push and iCloud/CloudKit are not available to Personal Teams, so the app must store data locally. Re-installing over the existing app from the same Xcode team keeps data; deleting the app deletes the data.

### Cited Findings
- Apple, verbatim: "You can register up to 10 App IDs, which expire after 7 days." "You can register up to 3 devices, which expire after 7 days." "You can install up to 3 apps per device. Provisioning profiles that enable apps to be installed on a device will expire 7 days from issuance. You'll need to rebuild and reinstall your app to your device after expiration." Personal Team: "you'll be required to reprovision your apps to a device periodically." — [Apple Developer Help: About your developer account](https://developer.apple.com/help/account/basics/about-your-developer-account/) (live page, 2026)
- In community explanations the 10-App-ID limit is a rolling 7-day window. An Apple DTS engineer suggests reusing one bundle ID to avoid hitting the cap. — [Apple Dev Forums thread 724896](https://developer.apple.com/forums/thread/724896), [thread 745359](https://developer.apple.com/forums/thread/745359) (community; not Apple doc)
- Apple DTS: push notifications and iCloud belong to the paid Apple Developer Program, and free-provisioning Personal Teams don't have them. — [Apple Dev Forums thread 718388](https://developer.apple.com/forums/thread/718388?page=1)
- Apple's capability-by-membership table has an "Apple Developer" (free) column next to ADP and ADEP, covering App Groups, iCloud (CloudKit, documents, KVS), Push, HealthKit, Background modes, Sign in with Apple, Siri, Data protection and Keychain sharing. The table's checkmarks could not be extracted, so the per-capability answer for HealthKit and App Groups could not be verified. — [Apple: Supported capabilities (iOS)](https://developer.apple.com/help/account/reference/supported-capabilities-ios)
- When an app expires it "will simply stop working" (won't launch). — [mybyways blog](https://mybyways.com/blog/new-limitations-imposed-on-free-apple-developer-account) (older blog, undated in results)
- An app whose signing identifier differs from the installed copy (for example, a different team ID prefix) fails with "application-identifier entitlement does not match". The usual fix is to delete the installed app, and deleting it removes its local data and group containers. — [Apple Dev Forums thread 126589](https://developer.apple.com/forums/thread/126589), [thread 5023](https://developer.apple.com/forums/thread/5023), [thread 17947](https://developer.apple.com/forums/thread/17947)
- One community post says offloaded apps count toward the 3-app cap. No Apple confirmation was found. — (search summary of Apple Dev Forums; unverified)

### Inferences
- For a workout app with 4 years of data: use local storage only (SwiftData/Core Data/files). Don't add the iCloud/CloudKit or Push capabilities, or Xcode signing fails on a Personal Team.
- Building and running again from Xcode with the same Apple ID/team and the same bundle ID installs over the existing app, and the data container is kept. This is standard iOS upgrade-install behaviour and the basis of the forum guidance; Apple doesn't spell it out for free teams. Never delete the app to "fix" a signing error without exporting the data first.
- Expired apps keep their data on the device (the app just won't launch until re-signed and reinstalled over the top). This is widely reported in the community, but I found no Apple doc saying so explicitly. See Gaps.
- Recommend building an export/backup feature into the app (JSON/CSV export via the Files app or share sheet), since data loss is possible if the app ever has to be deleted (team change, switching from Xcode-signing to SideStore-signing with a different bundle ID, etc.).
- Developer Mode (iOS 16+) must be enabled on the iPhone to run apps signed with development certificates. The GIGAZINE guide below confirms this for SideStore; it is the same requirement for Xcode-installed apps.

### Gaps
- Exact free-tier availability of HealthKit, App Groups (needed for widgets sharing data) and WidgetKit extensions: the Apple table's markers couldn't be extracted. Community knowledge holds that App Groups and HealthKit work on Personal Teams while iCloud, Push, Sign in with Apple and Associated Domains do not, but this is unconfirmed here. Widgets are an app extension, and each extension consumes an extra App ID (see the AltStore App IDs page below).
- No official Apple statement found on whether data persists through a lapsed profile. Treat it as very likely but unverified.

## 2. SideStore — how it works, status and version in 2026, iOS compatibility, computer dependence

### Takeaway
SideStore is the main free, computer-free-after-setup option for non-EU users. It re-signs your app with your free Apple ID on the phone every 7 days using a local loopback VPN (LocalDevVPN). It works on iOS 26, but it is fragile in autumn 2026: Apple server-side sign-in changes (Sept–Oct 2026) broke sign-in, and v0.6.4 is marked "DO NOT USE". A v0.7.0-alpha (15 Sep 2026) is the current "Latest" release. The same 3-app, 10-App-ID and 7-day limits apply.

### Cited Findings
- Requirements: iOS/iPadOS 15.0+, a device passcode, a computer (Windows/macOS/Linux/Chromebook) "only for initial install", an Apple Account, and Wi-Fi ("mobile networks are not suitable"). Install LocalDevVPN (App Store) and iloader on the computer. The VPN must be on whenever installing, updating or refreshing. — [SideStore docs: Prerequisites](https://docs.sidestore.io/docs/installation/prerequisites) (2026)
- FAQ: SideStore uses a VPN that "connects only to your own device, with no remote servers" and periodically refreshes apps in the background. A computer is needed only once. Free account: 3 apps at a time *including SideStore itself*, and 10 App IDs per week. A paid account removes the 3-app limit and extends expiry to 365 days. LiveContainer can bypass the 3-app limit but not the 10-App-ID limit. Login errors are usually anisette-server downtime, and the server can be changed in settings. The "iMac/MacBook Pro" devices that appear on the account are generated by the anisette server. Data carries over from AltStore/Sideloadly if you don't delete the original app and sideload the same IPA. — [SideStore docs: FAQ](https://docs.sidestore.io/docs/faq)
- Release history (GitHub): **0.7.0-alpha, 15 Sep 2026, marked "Latest"**, fixes HTTP 503 sign-in errors caused by Apple server-side changes and adds LocalDevVPN 1.3.0 handling; the page calls it a "temporary version". **0.6.4, 9 Sep 2026: "DO NOT USE"** (sign-in broken). 0.6.3 (5 May): users on iOS 26.4+ with VPN errors are told to reinstall with iloader. 0.6.2 (Jul 2025) replaced WireGuard with StosVPN and removed em_proxy. 0.6.0 is marked "Broken Refresh". Nightly builds now target SDK 27.2 / Xcode 27 (experimental). About 110 open issues. — [SideStore GitHub Releases](https://github.com/SideStore/SideStore/releases) (some dates lack years on the page; the nightly date is inconsistent)
- Apple changed its anisette/sign-in rules "several times since 2026-10-12". After a "second change on 2026-10-22", sign-in failed with error -80046. The breakage affected **AltStore, SideStore, Impactor, Sideloadly and xtool**, and the fix is a Mac-style anisette (v3) service. — [iPASide v1.2.9 release notes](https://newreleases.io/project/github/pwnapplehat/iPASide/release/v1.2.9) (third-party tool, Oct 2026)
- Setup walk-through (June 2026, iPhone 16 on **iOS 26.5**, Windows 11): install LocalDevVPN → iTunes (not Apple Music) on Windows → iloader → cable, trust, sign in with Apple ID → install "SideStore (Stable)" → trust the developer profile → **enable Developer Mode** and restart → connect LocalDevVPN → open SideStore and sign in. Apps show a 7-day countdown and "refresh in the background before the 7-day period ends". There are 3 apps including SideStore, and replacing apps counts toward 10 installs/week. — [GIGAZINE (EN), 28 Jun 2026](https://gigazine.net/gsc_news/en/20260628-sidestore-sideloading-ios/)
- In March 2026, SideStore + LiveContainer was reported working on iOS 26 up to 26.3/26.4, with a nightly ≥3.7.0 recommended for 26.4. — [iphonesoft.fr, 11 Mar 2026](https://iphonesoft.fr/2026/03/11/guide-ios-26-installer-sidestore-livecontainer-sideloader-apps-jailbreak) (the "3.7.0" version number looks inconsistent with SideStore's 0.x numbering; possibly LiveContainer's or a typo)
- A Sept 2026 report has a user on iOS 26.6.2 whose SideStore nightly fails to refresh with "Could not locate signing certificate". No fix had been posted. — [80aj.com, 24 Sep 2026](https://www.80aj.com/2026/09/24/ios-sidestore-certificate-issues/) (secondary/forum relay)
- A GitHub issue reports that login works but refresh fails even after changing the anisette server. — [SideStore issue #1237](https://github.com/SideStore/SideStore/issues/1237) (undated)

### Inferences
- Under SideStore, the user's own app takes 1 of the 3 slots (SideStore takes another), which is fine for one workout app.
- Reliability is the main weakness. If background refresh silently fails (VPN off, anisette down, Apple changes), the app expires after 7 days and won't open until refreshed. Data should still be on the device but is inaccessible until then. The user should open SideStore manually every few days rather than relying on background refresh.
- SideStore re-signs IPAs under your team. If the user installs the app via Xcode and later via SideStore (or the reverse), the bundle/team identifiers may differ, so it may be treated as a different app (separate data) or require deletion. Pick one method and stick with it.
- Because Apple's server-side changes in Sept–Oct 2026 broke multiple tools at once, any free sideloading route should be treated as "works most weeks, occasionally breaks for days to weeks".

### Gaps
- Official docs don't describe the pairing-file / minimuxer internals; current docs only mention LocalDevVPN + iloader (iloader appears to generate and place the pairing file).
- Whether 0.7.0-alpha works after Apple's 22 Oct 2026 change could not be confirmed.
- No reliable recent Reddit (r/SideStore, r/sideloaded) threads retrieved.

## 3. AltStore Classic vs AltStore PAL — status in 2026

### Takeaway
AltStore Classic (free, non-EU) is still maintained. AltStore 2.3 (14 Sep 2026) added "Remote AltServer" for computer-free sideloading over Wi-Fi, and 2.3.1 (21 Oct 2026) fixed refresh/sign-in errors. Traditionally it needs AltServer running on a Mac on the same Wi-Fi to refresh every 7 days. AltStore PAL is the EU (plus Japan/Brazil per press) marketplace and is not available to a Saudi user.

### Cited Findings
- AltStore (Classic) 2.3.1, 21 Oct 2026: experimental "Randomize Bundle IDs" (for "provisioning profile is banned" errors), fixes error -80045 on sideload/refresh, 2FA codes not appearing, background refresh, Remote AltServer error handling. 2.3, 14 Sep 2026: **added Remote AltServer ("sideloading without a computer over WiFi")** and a Liquid Glass redesign for iOS 26. 2.2, 16 Apr 2026. — [AltStore release notes](https://faq.altstore.io/release-notes/altstore)
- AltServer: 1.7.4 (Windows only, 24 Mar 2026) fixed apps crashing on launch on iOS 26.4. 1.7.3 (Windows, 8 Feb 2026) fixed error -22410. The latest macOS AltServer listed is 1.7.3 (22 May 2025), with no iOS 26-specific macOS fix listed. — [AltServer release notes](https://faq.altstore.io/release-notes/altserver)
- AltStore apps expire after 7 days and can't be opened after that. AltStore refreshes in the background. "Deactivating" an app backs up all its data before removal, and "Activate" reinstalls it and restores the data (a workaround for the 3-active-app limit). — [AltStore FAQ: Getting Started](https://faq.altstore.io/altstore-classic/your-altstore)
- 10 App IDs at a time on a free account, each expiring after a week. Each app extension needs its own App ID. — [AltStore FAQ: App IDs](https://faq.altstore.io/altstore-classic/app-ids)
- AltStore PAL 2.3 (11 Mar 2026), 2.3.1 (17 Mar 2026). A June 2026 article says PAL requires iOS 26.5+. — [AltStore PAL notes](https://faq.altstore.io/release-notes/altstore-pal); [Olhar Digital, 19 Jun 2026](https://olhardigital.com.br/2026/06/19/pro/seu-iphone-agora-pode-ter-outra-loja-alem-da-app-store-veja-como-funciona/)
- Older Reddit reports of AltStore Classic errors 1200/1201/2002 after upgrading to iOS 26 (undated; may predate the 2026 fixes). — [r/AltStore via redlib](https://redlib.hackliberty.org/r/AltStore/comments/1l7tbrm/troubleshooting_ios_26/mwzf93g/?context=3)
- AltStore was also affected by Apple's Oct 2026 sign-in changes. — [iPASide v1.2.9 notes](https://newreleases.io/project/github/pwnapplehat/iPASide/release/v1.2.9)

### Inferences
- For a Mac owner, AltStore Classic + AltServer on the Mac is a reasonable alternative to SideStore. Refreshes happen when the iPhone and Mac are on the same Wi-Fi (or via the new Remote AltServer). The AltStore "deactivate/activate" backup feature is a useful data-safety tool.
- Because the user builds the app in Xcode anyway, plain Xcode re-run every ≤7 days is functionally equivalent to AltServer refresh and has fewer moving parts (no third-party anisette).

### Gaps
- How "Remote AltServer" works exactly (whether it still needs a machine running somewhere) wasn't documented in the retrieved notes.
- No macOS AltServer release in 2026 was found; whether Mac AltServer works fully on iOS 26.4+ is unconfirmed.

## 4. Other options — Sideloadly, TrollStore, enterprise certs, signing services, Developer Mode

### Takeaway
Sideloadly is a computer-based re-signer, with the same 7-day limit and also hit by Apple's Oct 2026 sign-in change. TrollStore (permanent installs) only works on iOS 14.0b2–16.6.1, 16.7 RC and 17.0, so it is irrelevant on iOS 18/26. Enterprise certificates and paid signing services aren't recommended. Developer Mode must be enabled.

### Cited Findings
- TrollStore supported versions: "14.0 beta 2 - 16.6.1, 16.7 RC (20H18), 17.0". 16.7.x and 17.0.1+ "will NEVER be supported (unless a third CoreTrust bug is discovered…)". — [opa334/TrollStore README](https://github.com/opa334/TrollStore)
- Sideloadly was among the tools broken by Apple's sign-in/anisette change in Oct 2026. — [iPASide v1.2.9 notes](https://newreleases.io/project/github/pwnapplehat/iPASide/release/v1.2.9)
- Developer Mode must be enabled (Settings > Privacy & Security), followed by a restart, for sideloaded dev-signed apps. — [GIGAZINE, Jun 2026](https://gigazine.net/gsc_news/en/20260628-sidestore-sideloading-ios/)
- SideStore/LiveContainer: the SparseRestore exploit for bypassing the 3-app limit only works on iOS 18 db5/18.0.1 and below. — [SideStore FAQ](https://docs.sidestore.io/docs/faq)

### Inferences
- Enterprise-certificate "signing services" (paid UDID registration, shared certs) violate Apple's terms, get revoked unpredictably, and would put 4 years of personal data at risk. Not recommended. (No source retrieved specifically; general knowledge.)
- The AltStore 2.3.1 note about "provisioning profile is banned" errors suggests Apple is also cracking down on some reused bundle IDs/profiles.

### Gaps
- No 2026 Sideloadly changelog retrieved. No sources fetched on enterprise cert / signing service revocations in 2026.

## 5. TestFlight — requires paid membership? build expiry?

### Takeaway
TestFlight builds last 90 days, and TestFlight requires App Store Connect, which is only available with paid Apple Developer Program membership. It is not a free option.

### Cited Findings
- "You can test a build for up to 90 days." "Your build becomes unavailable for testers after 90 days." — [Apple: TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview)
- Apple: to use advanced capabilities and distribution, "join the Apple Developer Program," which gives access to "Certificates, Identifiers & Profiles and App Store Connect — a suite of tools that allows you to submit and manage your apps for beta testing and distribution". — [Apple Developer Help: About your developer account](https://developer.apple.com/help/account/basics/about-your-developer-account/)
- Forum reports of App Store Connect saying you must "renew your Apple Developer Program membership before distributing beta builds", plus widespread TestFlight build-expiry problems from about 9 Oct 2026. — [Apple Dev Forums thread 841782](https://developer.apple.com/forums/thread/841782), [thread 848523](https://developer.apple.com/forums/thread/848523)
- Paid membership extends dev-signed app expiry to 365 days (per SideStore FAQ). — [SideStore FAQ](https://docs.sidestore.io/docs/faq)

### Inferences
- TestFlight is not free. Note for the report: if the user ever pays $99, they get 1-year dev-signed installs (Xcode) or 90-day TestFlight builds, plus iCloud/CloudKit backup.

### Gaps
- The scraped Apple pages didn't show the comparison-table checkmark explicitly saying "TestFlight: ADP only". The conclusion rests on App Store Connect being an ADP benefit.

## 6. Does free provisioning still work in 2026? Recent Apple changes

### Takeaway
Yes. Apple's own docs (live in 2026) still describe Personal Team provisioning with 7-day expiry. Plain Xcode-to-device install isn't affected by the anisette crackdown, which targets third-party tools that emulate a Mac/Xcode login. Apple's Sept–Oct 2026 server-side changes broke sign-in for SideStore, AltStore, Sideloadly and others for a period.

### Cited Findings
- Personal Team rules are still documented. — [Apple Developer Help](https://developer.apple.com/help/account/basics/about-your-developer-account/)
- Sept 2026: SideStore 0.6.4 sign-in broken by Apple server-side changes (HTTP 503), and 0.7.0-alpha issued as a fix. — [SideStore Releases](https://github.com/SideStore/SideStore/releases)
- Oct 12–22, 2026: Apple repeatedly changed the anisette rules, rejecting anisette from Apple's Android libraries (error -80046). This affected AltStore, SideStore, Impactor, Sideloadly and xtool. — [iPASide v1.2.9](https://newreleases.io/project/github/pwnapplehat/iPASide/release/v1.2.9)
- AltStore 2.3.1 (21 Oct 2026) fixed error -80045 and added bundle-ID randomization for "provisioning profile is banned". — [AltStore release notes](https://faq.altstore.io/release-notes/altstore)

### Inferences
- The most robust free route is the official one: re-run from Xcode on the user's own Mac at least once every 7 days (USB or Xcode wireless debugging on the same Wi-Fi). It uses genuine Apple tooling and real Mac credentials, so it is the least exposed to Apple's anti-sideloading changes.

### Gaps
- Whether Apple's Oct 2026 changes affected genuine Xcode Personal Team signing: no reports found suggesting so.

## 7. Risks to app data — signature lapse, deletion, re-signing

### Takeaway
A lapsed signature makes the app un-launchable, but the data container stays as long as the app isn't deleted. Re-signing/reinstalling over it with the same bundle ID and team restores access. Deleting the app, or being forced to delete it because the signing identity changed, wipes local data. Build an export/backup feature and rely on iPhone backups.

### Cited Findings
- AltStore apps can't be opened after the 7-day expiry. Deactivate/activate backs up and restores data. — [AltStore FAQ](https://faq.altstore.io/altstore-classic/your-altstore)
- SideStore data carries over from AltStore/Sideloadly if you don't remove the original app and sideload the same IPA. The page cannot guarantee data survives switching to nightly or unofficial builds. — [SideStore FAQ](https://docs.sidestore.io/docs/faq)
- An identifier mismatch (team prefix change) forces deletion, which deletes local data and group containers. — [Apple Dev Forums thread 126589](https://developer.apple.com/forums/thread/126589), [thread 5023](https://developer.apple.com/forums/thread/5023)

### Inferences
- Mitigations: (a) keep the same Apple ID, team and bundle ID forever; (b) add in-app export to Files/iCloud Drive (writing a file via the document picker doesn't need the iCloud capability) and periodic auto-export; (c) the app's data is included in the device's iCloud/Finder backup. Expected to be included (sideloaded app containers are normally backed up), but not verified here.
- Avoid a migration that changes the team ID (e.g. later joining the paid program changes the team prefix). Export the data first.

### Gaps
- No primary source on whether development-signed/sideloaded apps' data is included in iCloud device backups and restorable.

## 8. Alternative: PWA (Add to Home Screen)

### Takeaway
A Home Screen web app needs no signing and never expires. It gets the same large storage quotas as Safari, and WebKit grants `navigator.storage.persist()` mostly based on whether the site is opened as a Home Screen web app, which exempts it from eviction. Home Screen web apps aren't subject to Safari's 7-day counter in the same way. Still, browser storage is less durable than native for 4 years of irreplaceable data, so it needs export/backup. EU-specific PWA removal (iOS 17.4 controversy, later reversed) doesn't apply in Saudi Arabia.

### Cited Findings
- WebKit (10 Aug 2023): origin quota up to 60% of disk for browser apps. Standalone/Home Screen web apps get the same quotas as in the browser. Eviction happens under the overall quota, storage pressure, or "when the user hasn't interacted with the site for some time", LRU per origin. Persistent-mode origins are excluded. `navigator.storage.persist()` is granted by heuristics "like whether the website is opened as a Home Screen Web App." — [WebKit blog: Updates to Storage Policy](https://webkit.org/?p=14403) (2023; the most recent official policy found, may have changed)
- WebKit clarification: Home Screen web apps are not part of Safari and have their own counter of days of use (re the 7-day ITP script-writable storage cap). — [OSNews quoting WebKit update](https://www.osnews.com/?p=131566) (2020; old)
- Developer reports of persistence uncertainty for iOS PWAs beyond 7 days. — [Apple Dev Forums thread 710157](https://developer.apple.com/forums/thread/710157) (2022; old)
- MDN on storage quotas and eviction criteria. — [MDN](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

### Inferences
- A PWA is viable for a workout tracker if it's used regularly (daily use resets the inactivity timer) and calls `persist()`. It loses HealthKit, native widgets and some background features, and it must be hosted somewhere (free static hosting such as GitHub Pages works). Data is per-origin, so changing the domain loses the data.
- The PWA is the only truly free route with no 7-day maintenance. The native Xcode route gives a better app but needs a weekly re-run from the Mac.

### Gaps
- No 2025–2026 WebKit storage-policy update found. iOS 26-specific PWA changes (e.g. "open as web app" defaults) weren't researched in depth.
