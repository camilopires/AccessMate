import Foundation

#if canImport(FoundationModels)
import FoundationModels
#endif

/// Apple Foundation Models adapter for the conversational Report
/// intake. iOS 26.0+ only; on older OS every API returns
/// `.unsupported`. The session is retained across turns so the model
/// keeps context.
@MainActor
final class AppleFMSession: ObservableObject {

    enum State {
        case idle
        case unsupported
        case ready
        case awaitingUser
        case thinking
        case complete(IncidentFacts)
        case error(String)
    }

    @Published private(set) var state: State = .idle

    #if canImport(FoundationModels)
    @available(iOS 26.0, *)
    @Generable
    struct FactsPayload {
        var whenISO: String?
        var operatorName: String?
        var scenarioId: String?
        var narrative: String?
        var accompanied: Bool?
        var staffInteractions: String?
        var witnesses: String?
        var waitedMinutes: Int?
    }

    @available(iOS 26.0, *)
    @Generable
    struct Turn {
        var message: String
        var isComplete: Bool
        var facts: FactsPayload?
    }

    @available(iOS 26.0, *)
    private var session: LanguageModelSession?
    #endif

    private static let systemPrompt = """
    You are AccessMate's incident-report assistant. Your job is to gather \
    the facts needed to file an accessibility complaint with a UK rail \
    operator. Ask ONE question at a time, in plain English. Keep questions \
    under 15 words. Required: whenISO, operatorName, scenarioId (one of \
    missed-passenger-assist, step-free-route-blocked, assistance-no-show, \
    other), and accompanied (bool). Optional: staffInteractions, witnesses, \
    waitedMinutes, narrative. Set isComplete=true the moment all four \
    required fields are filled — do not chit-chat. Do not give legal advice. \
    Do not promise outcomes.
    """

    func start() async {
        #if canImport(FoundationModels)
        guard #available(iOS 26.0, *) else { state = .unsupported; return }
        switch SystemLanguageModel.default.availability {
        case .available:
            let s = LanguageModelSession(
                model: SystemLanguageModel.default,
                instructions: Self.systemPrompt
            )
            self.session = s
            state = .ready
        case .unavailable(let reason):
            state = .error(String(describing: reason))
        @unknown default:
            state = .error("unknown availability")
        }
        #else
        state = .unsupported
        #endif
    }

    struct Reply {
        let assistantText: String
        let isComplete: Bool
        let facts: IncidentFacts?
    }

    func send(_ userText: String) async -> Reply? {
        #if canImport(FoundationModels)
        guard #available(iOS 26.0, *), let session else {
            state = .unsupported
            return nil
        }
        state = .thinking
        do {
            let response = try await session.respond(to: userText, generating: Turn.self)
            let turn = response.content
            let facts = turn.facts.map { p in
                IncidentFacts(
                    whenISO: p.whenISO,
                    operatorName: p.operatorName,
                    scenarioId: p.scenarioId,
                    narrative: p.narrative,
                    accompanied: p.accompanied,
                    staffInteractions: p.staffInteractions,
                    witnesses: p.witnesses,
                    waitedMinutes: p.waitedMinutes
                )
            }
            if turn.isComplete, let f = facts {
                state = .complete(f)
            } else {
                state = .awaitingUser
            }
            return Reply(assistantText: turn.message, isComplete: turn.isComplete, facts: facts)
        } catch {
            state = .error(error.localizedDescription)
            return nil
        }
        #else
        state = .unsupported
        return nil
        #endif
    }

    static func isAvailable() -> Bool {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability { return true }
        }
        #endif
        return false
    }
}
