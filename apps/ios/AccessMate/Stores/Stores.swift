import Foundation
import SwiftUI

/// Top-level observable holder for the app's persistent state. Each
/// child store is independently observable.
final class Stores: ObservableObject {
    @Published var incidents = IncidentsStore()
    @Published var profile = ProfileStore()
    @Published var settings = SettingsStore()
}

/// Persisted JSON-blob stores backed by UserDefaults — small payloads,
/// fits in <1MB per key. A SwiftData migration is on the roadmap.
final class IncidentsStore: ObservableObject {
    @Published private(set) var all: [Incident]

    private let key = "accessmate.incidents.v1"

    init() {
        self.all = Self.load(key: "accessmate.incidents.v1")
    }

    static func load(key: String) -> [Incident] {
        guard let data = UserDefaults.standard.data(forKey: key) else { return [] }
        return (try? JSONDecoder().decode([Incident].self, from: data)) ?? []
    }

    private func persist() {
        if let data = try? JSONEncoder().encode(all) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    func upsert(_ inc: Incident) {
        if let idx = all.firstIndex(where: { $0.id == inc.id }) {
            all[idx] = inc
        } else {
            all.append(inc)
        }
        persist()
    }

    func remove(id: String) {
        all.removeAll { $0.id == id }
        persist()
    }

    func setStatus(id: String, _ status: IncidentStatus) {
        if let idx = all.firstIndex(where: { $0.id == id }) {
            all[idx].status = status
            persist()
        }
    }
}

final class ProfileStore: ObservableObject {
    @Published var profile: Profile

    private let key = "accessmate.profile.v1"

    init() {
        if let data = UserDefaults.standard.data(forKey: "accessmate.profile.v1"),
           let p = try? JSONDecoder().decode(Profile.self, from: data) {
            self.profile = p
        } else {
            self.profile = Profile()
        }
    }

    func save(_ next: Profile) {
        profile = next
        if let data = try? JSONEncoder().encode(profile) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}

final class SettingsStore: ObservableObject {
    struct Settings: Codable {
        var fontScale: Double = 1.0
        var highContrast: Bool = false
        var reduceMotion: Bool = false
    }

    @Published var current: Settings

    private let key = "accessmate.settings.v1"

    init() {
        if let data = UserDefaults.standard.data(forKey: "accessmate.settings.v1"),
           let s = try? JSONDecoder().decode(Settings.self, from: data) {
            self.current = s
        } else {
            self.current = Settings()
        }
    }

    func save(_ next: Settings) {
        current = next
        if let data = try? JSONEncoder().encode(current) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
