import ExpoModulesCore

#if canImport(FoundationModels)
import FoundationModels
#endif

/**
 * AppleFmModule
 *
 * Bridges Apple's on-device Foundation Models LLM into JavaScript for
 * AccessMate. Two surfaces:
 *
 *   1. Single-shot `polish(prompt, systemPrompt)` — used by the
 *      complaint-polishing pipeline.
 *   2. Multi-turn `startConversation` / `sendMessage` /
 *      `endConversation` — used by the conversational Report intake.
 *      Sessions are retained in a Swift dictionary keyed by UUID so
 *      successive turns preserve context.
 *
 * Requires iOS 26.0+. Lower deployment targets compile but every API
 * surfaces `AppleFmError.unsupportedOS`.
 */
public class AppleFmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleFm")

    AsyncFunction("isAvailable") { () -> Bool in
      AppleFmAvailability.isAvailableNow()
    }

    AsyncFunction("getAvailability") { () -> [String: Any] in
      AppleFmAvailability.payload()
    }

    AsyncFunction("polish") { (prompt: String, systemPrompt: String) async throws -> String in
      try await AppleFmPolisher.polish(prompt: prompt, systemPrompt: systemPrompt)
    }

    AsyncFunction("startConversation") { (systemPrompt: String) async throws -> String in
      try await AppleFmConversations.start(systemPrompt: systemPrompt)
    }

    AsyncFunction("sendMessage") {
      (sessionId: String, userText: String) async throws -> [String: Any] in
      try await AppleFmConversations.send(sessionId: sessionId, userText: userText)
    }

    AsyncFunction("endConversation") { (sessionId: String) in
      AppleFmConversations.end(sessionId: sessionId)
    }
  }
}

/// Pure-ish helpers so the Swift logic is testable without spinning up
/// the full Expo Modules host.
public enum AppleFmReason: String {
  case unsupportedDevice = "unsupported-device"
  case appleIntelligenceNotEnabled = "apple-intelligence-not-enabled"
  case modelNotReady = "model-not-ready"
  case unknown = "unknown"
}

public enum AppleFmError: Error, Equatable {
  case unsupportedOS
  case unavailable(reason: AppleFmReason)
  case unknownSession
}

public enum AppleFmAvailability {
  public static func isAvailableNow() -> Bool {
    #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        if case .available = SystemLanguageModel.default.availability {
          return true
        }
      }
    #endif
    return false
  }

  public static func payload() -> [String: Any] {
    #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        let availability = SystemLanguageModel.default.availability
        switch availability {
        case .available:
          return ["available": true]
        case let .unavailable(reason):
          return [
            "available": false,
            "reason": mapReason(reason).rawValue,
          ]
        @unknown default:
          return ["available": false, "reason": AppleFmReason.unknown.rawValue]
        }
      }
    #endif
    return ["available": false, "reason": AppleFmReason.unsupportedDevice.rawValue]
  }

  #if canImport(FoundationModels)
    @available(iOS 26.0, *)
    static func mapReason(
      _ reason: SystemLanguageModel.Availability.UnavailableReason
    ) -> AppleFmReason {
      switch reason {
      case .deviceNotEligible:
        return .unsupportedDevice
      case .appleIntelligenceNotEnabled:
        return .appleIntelligenceNotEnabled
      case .modelNotReady:
        return .modelNotReady
      @unknown default:
        return .unknown
      }
    }
  #endif
}

public enum AppleFmPolisher {
  public static func polish(prompt: String, systemPrompt: String) async throws -> String {
    #if canImport(FoundationModels)
      guard #available(iOS 26.0, *) else { throw AppleFmError.unsupportedOS }
      let model = SystemLanguageModel.default
      switch model.availability {
      case .available:
        let session = LanguageModelSession(model: model, instructions: systemPrompt)
        let response = try await session.respond(to: prompt)
        return response.content
      case let .unavailable(reason):
        throw AppleFmError.unavailable(reason: AppleFmAvailability.mapReason(reason))
      @unknown default:
        throw AppleFmError.unavailable(reason: .unknown)
      }
    #else
      throw AppleFmError.unsupportedOS
    #endif
  }
}

// MARK: - Multi-turn conversation support

#if canImport(FoundationModels)
  @available(iOS 26.0, *)
  @Generable
  public struct AppleFmIncidentFactsPayload: Codable {
    public var whenISO: String?
    public var operatorName: String?
    public var scenarioId: String?
    public var narrative: String?
    public var accompanied: Bool?
    public var staffInteractions: String?
    public var witnesses: String?
    public var waitedMinutes: Int?
  }

  @available(iOS 26.0, *)
  @Generable
  public struct AppleFmConversationTurn: Codable {
    /// What the assistant should say to the user this turn.
    public var message: String
    /// True once every required field is filled and the model should
    /// stop asking questions.
    public var isComplete: Bool
    /// Best-effort structured capture so far.
    public var facts: AppleFmIncidentFactsPayload?
  }
#endif

public enum AppleFmConversations {
  #if canImport(FoundationModels)
    @available(iOS 26.0, *)
    private static var sessions: [String: LanguageModelSession] = [:]
  #endif

  public static func start(systemPrompt: String) async throws -> String {
    #if canImport(FoundationModels)
      guard #available(iOS 26.0, *) else { throw AppleFmError.unsupportedOS }
      let model = SystemLanguageModel.default
      switch model.availability {
      case .available:
        let session = LanguageModelSession(model: model, instructions: systemPrompt)
        let id = UUID().uuidString
        sessions[id] = session
        return id
      case let .unavailable(reason):
        throw AppleFmError.unavailable(reason: AppleFmAvailability.mapReason(reason))
      @unknown default:
        throw AppleFmError.unavailable(reason: .unknown)
      }
    #else
      throw AppleFmError.unsupportedOS
    #endif
  }

  public static func send(sessionId: String, userText: String) async throws -> [String: Any] {
    #if canImport(FoundationModels)
      guard #available(iOS 26.0, *) else { throw AppleFmError.unsupportedOS }
      guard let session = sessions[sessionId] else { throw AppleFmError.unknownSession }
      let response = try await session.respond(
        generating: AppleFmConversationTurn.self,
        to: userText
      )
      let turn = response.content
      var payload: [String: Any] = [
        "assistantText": turn.message,
        "isComplete": turn.isComplete,
      ]
      if let f = turn.facts {
        payload["facts"] = factsAsDictionary(f)
      }
      return payload
    #else
      throw AppleFmError.unsupportedOS
    #endif
  }

  public static func end(sessionId: String) {
    #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        sessions.removeValue(forKey: sessionId)
      }
    #endif
  }

  #if canImport(FoundationModels)
    @available(iOS 26.0, *)
    private static func factsAsDictionary(_ f: AppleFmIncidentFactsPayload) -> [String: Any] {
      var d: [String: Any] = [:]
      if let v = f.whenISO { d["whenISO"] = v }
      if let v = f.operatorName { d["operatorName"] = v }
      if let v = f.scenarioId { d["scenarioId"] = v }
      if let v = f.narrative { d["narrative"] = v }
      if let v = f.accompanied { d["accompanied"] = v }
      if let v = f.staffInteractions { d["staffInteractions"] = v }
      if let v = f.witnesses { d["witnesses"] = v }
      if let v = f.waitedMinutes { d["waitedMinutes"] = v }
      return d
    }
  #endif
}
