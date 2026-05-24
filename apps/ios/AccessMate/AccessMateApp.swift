import SwiftUI

@main
struct AccessMateApp: App {
    @StateObject private var stores = Stores()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(stores)
                .tint(Theme.accentDeep)
        }
    }
}
