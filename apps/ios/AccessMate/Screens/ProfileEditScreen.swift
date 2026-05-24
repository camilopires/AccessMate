import SwiftUI

struct ProfileEditScreen: View {
    @EnvironmentObject var stores: Stores
    @Environment(\.dismiss) private var dismiss

    @State private var draft: Profile = Profile()
    @State private var wheelchair: String = "none"

    var body: some View {
        Form {
            Section("Mobility") {
                Picker("Mobility aid", selection: $wheelchair) {
                    Text("None").tag("none")
                    Text("Manual wheelchair").tag("manual")
                    Text("Powered wheelchair").tag("powered")
                    Text("Mobility scooter").tag("mobility-scooter")
                }
            }
            Section("Sensory") {
                Toggle("Blind", isOn: bind(\.sensory, \.isBlind))
                Toggle("Low vision", isOn: bind(\.sensory, \.isLowVision))
                Toggle("Deaf", isOn: bind(\.sensory, \.isDeaf))
                Toggle("Hard of hearing", isOn: bind(\.sensory, \.isHardOfHearing))
            }
            Section("Communication") {
                Toggle("Prefers British Sign Language", isOn: bind(\.communication, \.prefersBSL))
                Toggle("Prefers written communication", isOn: bind(\.communication, \.prefersWriting))
                Toggle("Needs extra time", isOn: bind(\.communication, \.needsExtraTime))
            }
            Section("Notes for staff") {
                TextEditor(text: Binding(
                    get: { draft.notes ?? "" },
                    set: { draft.notes = $0.isEmpty ? nil : $0 }
                ))
                .frame(minHeight: 100)
            }
        }
        .onAppear {
            draft = stores.profile.profile
            wheelchair = draft.mobility?.wheelchairType ?? "none"
        }
        .navigationTitle("Your accessibility profile")
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    if wheelchair == "none" {
                        draft.mobility = nil
                    } else {
                        draft.mobility = ProfileMobility(usesWheelchair: true, wheelchairType: wheelchair)
                    }
                    stores.profile.save(draft)
                    dismiss()
                }
            }
        }
    }

    private func bind<Sub: Hashable>(
        _ section: WritableKeyPath<Profile, ProfileSensory?>,
        _ key: WritableKeyPath<ProfileSensory, Bool?>
    ) -> Binding<Bool> where Sub == ProfileSensory {
        Binding(
            get: { draft[keyPath: section]?[keyPath: key] ?? false },
            set: { v in
                var s = draft[keyPath: section] ?? ProfileSensory()
                s[keyPath: key] = v
                draft[keyPath: section] = s
            }
        )
    }

    private func bind(
        _ section: WritableKeyPath<Profile, ProfileCommunication?>,
        _ key: WritableKeyPath<ProfileCommunication, Bool?>
    ) -> Binding<Bool> {
        Binding(
            get: { draft[keyPath: section]?[keyPath: key] ?? false },
            set: { v in
                var s = draft[keyPath: section] ?? ProfileCommunication()
                s[keyPath: key] = v
                draft[keyPath: section] = s
            }
        )
    }
}
