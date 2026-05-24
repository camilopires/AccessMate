import Foundation

enum TransportMode: String, Codable {
    case rail, air, bus, taxi, tfl
}

enum Regulator: String, Codable {
    case orr, caa, ehrc, local, none
}

struct OperatorAssistance: Codable, Hashable {
    var phone: String
    var bookingUrl: String?
    var accessibilityPageUrl: String?
}

struct OperatorComplaintsRoute: Codable, Hashable {
    var primaryEmail: String?
    var primaryUrl: String?
    var regulator: Regulator
}

struct OperatorEntry: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var mode: TransportMode
    var assistance: OperatorAssistance
    var complaintsRoute: OperatorComplaintsRoute
    var lastVerifiedUTC: String
}

struct ScenarioTemplate: Codable, Identifiable, Hashable {
    var id: String
    var title: String
    var mode: TransportMode
    var emailSubject: String
    var header: String
    var legalParagraph: String
    var ask: String
    var regulator: Regulator
}

enum IncidentStatus: String, Codable, CaseIterable, Hashable {
    case draft, in_progress, completed, discarded
}

struct IncidentFacts: Codable, Hashable {
    var whenISO: String?
    var operatorName: String?
    var scenarioId: String?
    var narrative: String?
    var accompanied: Bool?
    var staffInteractions: String?
    var witnesses: String?
    var waitedMinutes: Int?
}

struct Incident: Codable, Identifiable, Hashable {
    var id: String
    var status: IncidentStatus
    var startedAtISO: String
    var title: String?
    var facts: IncidentFacts?
    var templateId: String?
    var draftBody: String?
    var recipient: String?
    var operatorId: String?
    var sentAtISO: String?
    var resolvedAtISO: String?
}

struct ProfileMobility: Codable, Hashable {
    var usesWheelchair: Bool?
    var wheelchairType: String?
}

struct ProfileSensory: Codable, Hashable {
    var isBlind: Bool?
    var isLowVision: Bool?
    var isDeaf: Bool?
    var isHardOfHearing: Bool?
}

struct ProfileCommunication: Codable, Hashable {
    var prefersBSL: Bool?
    var prefersWriting: Bool?
    var needsExtraTime: Bool?
}

struct Profile: Codable, Hashable {
    var mobility: ProfileMobility?
    var sensory: ProfileSensory?
    var communication: ProfileCommunication?
    var notes: String?

    var isEmpty: Bool {
        mobility == nil && sensory == nil && communication == nil && (notes ?? "").isEmpty
    }
}
