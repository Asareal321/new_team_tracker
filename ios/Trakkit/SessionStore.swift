import Foundation
import Security

// Where the sign-in actually lives.
//
// A hosted app cannot trust the web view to remember anything. WKWebView's
// localStorage is real storage, but iOS reclaims it under pressure, Safari's
// tracking prevention caps script-written storage, and every reinstall from
// Xcode replaces the app container outright. Any of those signs you out, and
// from the user's side they all look the same: opened the app, signed in
// again.
//
// So the session is mirrored into the Keychain, which survives all three, and
// put back before the page has a chance to look for it.
//
// What is stored is the Supabase session — an access token and a refresh
// token. That is credential material, which is exactly what the Keychain is
// for, and exactly why it does not go in UserDefaults. AfterFirstUnlock so a
// launch from a notification or a background refresh can still read it, and
// ThisDeviceOnly so it is never carried to another device by a backup.
enum SessionStore {
    private static let service = "ca.trakkitnow.session"
    private static let account = "supabase"

    static func save(_ json: String) {
        guard let data = json.data(using: .utf8) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary)

        var attributes = query
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(attributes as CFDictionary, nil)
    }

    static func read() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func clear() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
