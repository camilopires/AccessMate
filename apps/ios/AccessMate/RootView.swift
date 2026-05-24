import SwiftUI

struct RootView: View {
    @State private var selectedTab: Tab = .incidents

    enum Tab: Hashable {
        case incidents, passport, settings
    }

    var body: some View {
        // On iOS 26+ the TabView automatically adopts Liquid Glass for
        // the bottom bar; on iOS 18-25 it's stock chrome. Either way,
        // section cards inside each tab use CardSurface which switches
        // to .glassEffect() on iOS 26+ too.
        TabView(selection: $selectedTab) {
            NavigationStack {
                IncidentsScreen()
            }
            .tabItem { Label("Incidents", systemImage: "list.bullet.rectangle") }
            .tag(Tab.incidents)

            NavigationStack {
                PassportScreen()
            }
            .tabItem { Label("Passport", systemImage: "person.text.rectangle") }
            .tag(Tab.passport)

            NavigationStack {
                SettingsScreen()
            }
            .tabItem { Label("Settings", systemImage: "gearshape") }
            .tag(Tab.settings)
        }
        .background(Theme.paper.ignoresSafeArea())
    }
}
