import SwiftUI

struct SettingsScreen: View {
    @EnvironmentObject var stores: Stores

    var body: some View {
        Form {
            Section("Accessibility") {
                Toggle("High contrast", isOn: Binding(
                    get: { stores.settings.current.highContrast },
                    set: { v in
                        var s = stores.settings.current; s.highContrast = v
                        stores.settings.save(s)
                    }
                ))
                Toggle("Reduce motion", isOn: Binding(
                    get: { stores.settings.current.reduceMotion },
                    set: { v in
                        var s = stores.settings.current; s.reduceMotion = v
                        stores.settings.save(s)
                    }
                ))
                Picker("Font scale", selection: Binding(
                    get: { stores.settings.current.fontScale },
                    set: { v in
                        var s = stores.settings.current; s.fontScale = v
                        stores.settings.save(s)
                    }
                )) {
                    ForEach([1.0, 1.2, 1.4, 1.6, 2.0], id: \.self) { v in
                        Text(String(format: "%.1fx", v)).tag(v)
                    }
                }
            }

            Section("Your data") {
                Button {
                    // Export — share sheet with JSON payload
                    exportData()
                } label: {
                    Label("Export all data (JSON)", systemImage: "square.and.arrow.up")
                }

                Button(role: .destructive) {
                    wipe()
                } label: {
                    Label("Wipe device data", systemImage: "trash")
                }
            }

            Section("About") {
                Text("AccessMate is an accessibility-first travel companion. All data stays on your device unless you explicitly share or export it.")
                    .font(.system(size: 15))
            }
        }
        .navigationTitle("Settings")
        .scrollContentBackground(.hidden)
        .background(Theme.paper)
    }

    private func exportData() {
        // Placeholder — the share sheet wiring is on the v0.5 roadmap.
    }

    private func wipe() {
        for key in [
            "accessmate.incidents.v1",
            "accessmate.profile.v1",
            "accessmate.settings.v1",
        ] {
            UserDefaults.standard.removeObject(forKey: key)
        }
    }
}
