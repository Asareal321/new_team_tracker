# trakkit for iOS

A SwiftUI app that hosts the web app in a `WKWebView`. It is a real SwiftUI
app — `@main struct TrakkitApp: App` — not a rewrite. The board, garden,
quests, marketplace and calendar fill already work as React; rebuilding them
natively would take months and leave two implementations to keep in step.

## Where things live

`Trakkit.xcodeproj` is here, in the same repo as the web app, on purpose. The
Swift files used to exist twice — once here and once in a separate project on
the Desktop — and two copies of three files is two copies that drift. One repo,
one commit, one history.

Open it with:

    open ios/Trakkit.xcodeproj

**Never put the web app inside `ios/Trakkit/`.** Xcode 16 uses synchronised
folder groups: anything sitting in the target's folder is automatically part of
the target. A copy of the repo landed there once and Xcode tried to build
`node_modules` — 928 errors, and it had even added
`node_modules/@rollup/rollup-darwin-x64` to the library search paths.

## What needs rebuilding, and what does not

The shell loads `https://trakkitnow.ca` live. So:

* **A web feature** — push to GitHub, Vercel deploys, the app shows it on next
  launch or pull-to-refresh. No Xcode, no new build, no App Review.
* **A shell change** (`ios/Trakkit/*.swift`, the icon, Info.plist) — needs an
  archive and a new TestFlight build.

Almost everything is the first kind. That is the point of the architecture.

## Creating the Xcode project from scratch

Only needed if this one is ever lost. A hand-written `.xcodeproj` goes stale
and breaks in confusing ways, so make it in Xcode:

1. **File → New → Project → iOS → App**
   - Product Name: `Trakkit`
   - Interface: **SwiftUI**, Language: **Swift**
   - Organization Identifier: something you own, e.g. `ca.trakkitnow`
   - Bundle Identifier will read `ca.trakkitnow.Trakkit` — note it down
   - Save it **outside** this repo, or inside it and add `ios/Trakkit.xcodeproj`
     to `.gitignore`
2. Delete the generated `ContentView.swift` and `TrakkitApp.swift`
3. Drag in `TrakkitApp.swift`, `ContentView.swift`, `WebView.swift`
   (**Copy items if needed** unchecked if you want them to stay tracked here)
4. Drag `brand/appicon/*.png` into `Assets.xcassets → AppIcon`:
   Any Appearance, Dark, Tinted

## Staying signed in

The session is mirrored into the Keychain and put back before the page's own
scripts run, so the app opens signed in.

This is not belt-and-braces — WKWebView's `localStorage` cannot be relied on by
itself. iOS reclaims it under storage pressure, tracking prevention caps
script-written storage, and every reinstall from Xcode replaces the app
container. Any of those signs you out, and from the user's side all three look
identical: opened the app, had to sign in again.

`SessionStore.swift` is the Keychain half (`AfterFirstUnlockThisDeviceOnly` —
readable on a background launch, never carried to another device by a backup).
`bridgeScript` in `WebView.swift` is the JavaScript half. Signing out inside the
app posts an empty snapshot, which clears the Keychain — without that, signing
out would be undone by the next launch.

Note that reinstalling from Xcode no longer signs you out, because Keychain
items outlive the app container. If you *want* a signed-out state for testing,
sign out in the app rather than deleting it.

## Known limitation: Sign in with Google

Google rejects OAuth inside an embedded web view (`403: disallowed_useragent`),
so `WebView.swift` sends it out to `SFSafariViewController`. The callback then
lands in Safari rather than back in the app, which means **Google sign-in does
not complete inside the app yet**.

Use email and password while testing. Fixing it properly means:

1. Add a custom URL scheme (`trakkit://`) to the target's Info
2. Add `trakkit://auth-callback` to Supabase → Authentication → URL Configuration
3. Handle the incoming URL with `.onOpenURL` and hand the tokens to the web view

Worth doing before any public release; not worth blocking a TestFlight build on.

## App Review guideline 4.2

Internal TestFlight testing needs no review. **External** testing and the App
Store both do, and 4.2 ("Minimum Functionality") is written to reject apps that
are only a website in a box. The shell is the starting point, not the finished
argument — push notifications for a finished grow, a Home Screen widget showing
today's board, and Sign in with Apple are the native pieces that answer it.
