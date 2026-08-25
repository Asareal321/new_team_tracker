import SwiftUI
import WebKit
import SafariServices
// ObservableObject and @Published are Combine, and SwiftUI no longer re-exports
// it implicitly — without this the model silently fails to conform.
import Combine

enum AppConfig {
    static let siteURL = URL(string: "https://trakkitnow.ca")!
    /// Hosts that belong to the app. Anything else is somebody else's site and
    /// opens outside, so a tapped link can never strand the user in a browser
    /// with no back button.
    static let ownHosts: Set<String> = ["trakkitnow.ca", "www.trakkitnow.ca"]
}

@MainActor
final class WebViewModel: ObservableObject {
    @Published var isLoading = true
    @Published var hasLoadedOnce = false
    @Published var errorMessage: String?

    let url: URL
    weak var webView: WKWebView?

    init(url: URL) { self.url = url }

    func reload() {
        errorMessage = nil
        isLoading = true
        webView?.load(URLRequest(url: url))
    }
}

struct WebView: UIViewRepresentable {
    @ObservedObject var model: WebViewModel

    func makeCoordinator() -> Coordinator { Coordinator(model: model) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        // The site keeps its session in localStorage, so a non-persistent
        // store would sign the user out every launch.
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        // Bounce, but do not show the grey rubber-band area — the app is not a
        // document and the overscroll reads as a rendering fault.
        webView.scrollView.bounces = true
        webView.backgroundColor = .black
        webView.isOpaque = false

        let refresh = UIRefreshControl()
        refresh.addTarget(context.coordinator,
                          action: #selector(Coordinator.handleRefresh(_:)),
                          for: .valueChanged)
        webView.scrollView.refreshControl = refresh

        model.webView = webView
        webView.load(URLRequest(url: model.url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let model: WebViewModel
        init(model: WebViewModel) { self.model = model }

        @objc func handleRefresh(_ sender: UIRefreshControl) {
            model.webView?.reload()
        }

        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url, let host = url.host else {
                decisionHandler(.allow); return
            }

            // Google refuses OAuth inside an embedded web view — it returns
            // "403: disallowed_useragent" — so Sign in with Google has to leave
            // the WKWebView. SFSafariViewController shares Safari's cookie jar
            // and is the sanctioned surface for it.
            //
            // Note the limitation this leaves: the callback lands back in
            // Safari, not here. Until a custom-scheme redirect is configured in
            // Supabase, use email and password inside the app. See the README
            // beside this file.
            if host.hasSuffix("accounts.google.com") || host.hasSuffix("appleid.apple.com") {
                present(url)
                decisionHandler(.cancel)
                return
            }

            // Anything off our own domains opens outside.
            if navigationAction.navigationType == .linkActivated,
               !AppConfig.ownHosts.contains(host),
               !host.hasSuffix("supabase.co") {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }

            decisionHandler(.allow)
        }

        // target="_blank" has no window to open into here, so load it in place.
        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url { webView.load(URLRequest(url: url)) }
            return nil
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            model.isLoading = true
            model.errorMessage = nil
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            model.isLoading = false
            model.hasLoadedOnce = true
            webView.scrollView.refreshControl?.endRefreshing()
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            fail(error, webView)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            fail(error, webView)
        }

        private func fail(_ error: Error, _ webView: WKWebView) {
            model.isLoading = false
            webView.scrollView.refreshControl?.endRefreshing()
            // -999 is "a newer navigation replaced this one", which is normal.
            if (error as NSError).code == NSURLErrorCancelled { return }
            model.errorMessage = error.localizedDescription
        }

        private func present(_ url: URL) {
            guard let scene = UIApplication.shared.connectedScenes
                    .compactMap({ $0 as? UIWindowScene }).first,
                  let root = scene.keyWindow?.rootViewController else { return }
            root.present(SFSafariViewController(url: url), animated: true)
        }
    }
}
