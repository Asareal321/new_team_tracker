# trakkit for iOS

A SwiftUI app that hosts the web app in a `WKWebView`. It is a real SwiftUI
app — `@main struct TrakkitApp: App` — not a rewrite. The board, garden,
quests, marketplace and calendar fill already work as React; rebuilding them
natively would take months and leave two implementations to keep in step.

## Creating the Xcode project

There is no `.xcodeproj` here on purpose — a hand-written one goes stale and
breaks in confusing ways. Make it in Xcode, then add these files:

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
