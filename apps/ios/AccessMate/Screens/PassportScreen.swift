import SwiftUI

struct PassportScreen: View {
    @EnvironmentObject var stores: Stores
    @State private var editing = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                if stores.profile.profile.isEmpty {
                    CardSurface {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Set up your passport")
                                .font(.system(size: 22, weight: .bold, design: .serif))
                            Text("Staff can see your access needs at a glance. Takes about 90 seconds and stays on your device.")
                                .foregroundStyle(Theme.ink)
                            Button {
                                editing = true
                            } label: {
                                Label("Set up passport", systemImage: "person.text.rectangle.fill")
                                    .frame(maxWidth: .infinity, minHeight: 48)
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                            Text("You can skip anything and come back later.")
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.inkMuted)
                        }
                    }
                } else {
                    if let m = stores.profile.profile.mobility {
                        CardSurface {
                            VStack(alignment: .leading, spacing: 8) {
                                SectionLabel(text: "Mobility")
                                ForEach(mobilityFacts(m), id: \.self) { Text($0) }
                            }
                        }
                    }
                    if let s = stores.profile.profile.sensory {
                        CardSurface {
                            VStack(alignment: .leading, spacing: 8) {
                                SectionLabel(text: "Sensory")
                                ForEach(sensoryFacts(s), id: \.self) { Text($0) }
                            }
                        }
                    }
                    if let c = stores.profile.profile.communication {
                        CardSurface {
                            VStack(alignment: .leading, spacing: 8) {
                                SectionLabel(text: "Communication")
                                ForEach(communicationFacts(c), id: \.self) { Text($0) }
                            }
                        }
                    }
                    if let n = stores.profile.profile.notes, !n.isEmpty {
                        CardSurface {
                            VStack(alignment: .leading, spacing: 8) {
                                SectionLabel(text: "Notes")
                                Text(n)
                            }
                        }
                    }
                    Button { editing = true } label: {
                        Label("Edit profile", systemImage: "pencil")
                            .frame(maxWidth: .infinity, minHeight: 48)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                }
            }
            .padding(20)
        }
        .background(Theme.paper)
        .navigationTitle("Passport")
        .sheet(isPresented: $editing) {
            NavigationStack {
                ProfileEditScreen()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("SHOW STAFF")
                .font(.system(size: 12, weight: .semibold))
                .tracking(1.4)
                .foregroundStyle(Theme.inkMuted)
            Text("Accessibility passport")
                .font(.system(size: 28, weight: .bold, design: .serif))
                .foregroundStyle(Theme.ink)
        }
    }

    private func mobilityFacts(_ m: ProfileMobility) -> [String] {
        switch m.wheelchairType {
        case "powered":          return ["Powered wheelchair"]
        case "manual":           return ["Manual wheelchair"]
        case "mobility-scooter": return ["Mobility scooter"]
        default:                 return []
        }
    }

    private func sensoryFacts(_ s: ProfileSensory) -> [String] {
        var out: [String] = []
        if s.isBlind == true { out.append("Blind") }
        if s.isLowVision == true { out.append("Low vision") }
        if s.isDeaf == true { out.append("Deaf") }
        if s.isHardOfHearing == true { out.append("Hard of hearing") }
        return out
    }

    private func communicationFacts(_ c: ProfileCommunication) -> [String] {
        var out: [String] = []
        if c.prefersBSL == true { out.append("Prefers British Sign Language") }
        if c.prefersWriting == true { out.append("Prefers written communication") }
        if c.needsExtraTime == true { out.append("Needs extra time when speaking or reading") }
        return out
    }
}
