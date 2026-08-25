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

// The JavaScript half of the session bridge.
//
// Injected at document start, which is before any of the page's own scripts
// run — so the session is already in localStorage by the time Supabase looks
// for it, and the app boots signed in rather than asking you to sign in.
//
// Only Supabase's own auth keys are mirrored (`sb-<ref>-auth-token`), matched
// by pattern rather than by a fixed key: the project ref is not known on this
// side, and hard-coding it would break silently if the project ever changed.
private func bridgeScript(restoring session: String?) -> String {
    let payload = session ?? "null"
    return #"""
    (function () {
      var KEY = /^sb-.*-auth-token$/;
      var restored = __RESTORED__;
      if (restored) {
        for (var k in restored) {
          // Never overwrite a live session: the page may already hold a newer
          // one than the Keychain does.
          if (KEY.test(k) && !localStorage.getItem(k)) localStorage.setItem(k, restored[k]);
        }
      }
      function snapshot() {
        var out = {};
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (KEY.test(k)) out[k] = localStorage.getItem(k);
        }
        return out;
      }
      var last = null;
      function sync() {
        var now = JSON.stringify(snapshot());
        if (now === last) return;
        last = now;
        window.webkit.messageHandlers.session.postMessage(now);
      }
      sync();
      // Tokens refresh roughly hourly and a sign-out has to reach the Keychain
      // promptly. No single event covers both, so this polls.
      setInterval(sync, 5000);
      window.addEventListener('pagehide', sync);
    })();
    """#.replacingOccurrences(of: "__RESTORED__", with: payload)
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

        // Persistent storage is the fast path; the Keychain is the one that
        // actually survives. See SessionStore.
        let controller = WKUserContentController()
        controller.add(context.coordinator, name: "session")
        controller.addUserScript(WKUserScript(
            source: bridgeScript(restoring: SessionStore.read()),
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        config.userContentController = controller

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

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        let model: WebViewModel
        init(model: WebViewModel) { self.model = model }

        // The page reporting what its session is now. An empty snapshot means
        // signed out, and that must clear the Keychain — otherwise signing out
        // would be quietly undone by the next launch.
        func userContentController(_ controller: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            guard message.name == "session", let json = message.body as? String else { return }
            if json == "{}" { SessionStore.clear() } else { SessionStore.save(json) }
        }

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
