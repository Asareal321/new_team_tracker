import SwiftUI

// trakkit for iOS.
//
// A SwiftUI app that hosts the web app rather than reimplementing it. The
// board, the garden, the quests and the calendar fill are all thousands of
// lines of React that already work; rebuilding them in SwiftUI would take
// months and produce a second thing to keep in step with the first.
//
// What this shell adds over Safari: a Home Screen presence, its own splash,
// no browser chrome, and a place to grow real native pieces — push
// notifications, a Home Screen widget, Sign in with Apple. Those are also what
// answer App Review guideline 4.2, which exists to reject apps that are only a
// website in a box.

@main
struct TrakkitApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                // The web app paints its own background to the edges, so the
                // shell should not letterbox it.
                .ignoresSafeArea(.container, edges: .bottom)
                .preferredColorScheme(nil)   // follow the system; the site themes itself
        }
    }
}
