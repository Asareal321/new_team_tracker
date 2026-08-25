import SwiftUI

struct ContentView: View {
    @StateObject private var model = WebViewModel(url: AppConfig.siteURL)

    var body: some View {
        ZStack {
            // Matches the site's own ink so the gap during load is not a
            // white flash on a dark theme.
            Color(red: 7/255, green: 16/255, blue: 19/255)
                .ignoresSafeArea()

            WebView(model: model)
                .opacity(model.isLoading && !model.hasLoadedOnce ? 0 : 1)

            if model.isLoading && !model.hasLoadedOnce {
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(Color(red: 195/255, green: 247/255, blue: 58/255))
            }

            if let message = model.errorMessage {
                OfflineView(message: message) { model.reload() }
            }
        }
    }
}

// Offline is the one failure a hosted app must handle itself. Without this the
// user gets WebKit's own error page, which names the domain and looks like the
// app is broken rather than the network.
private struct OfflineView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Text("🌱").font(.system(size: 44))
            Text("Can’t reach trakkit")
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 32)
            Button("Try again", action: retry)
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 195/255, green: 247/255, blue: 58/255))
                .foregroundStyle(.black)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.background)
    }
}
