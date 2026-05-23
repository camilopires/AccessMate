import ExpoModulesCore

#if canImport(FoundationModels)
import FoundationModels
#endif

/**
 * AppleFmModule
 *
 * Bridges Apple's on-device Foundation Models LLM into JavaScript for
 * AccessMate's complaint polishing pipeline.
 *
 * Requires iOS 18.1+. All FoundationModels calls are gated by @available
 * so the module compiles fine for lower deployment targets — they simply
 * return "unsupported-device" availability at runtime.
 *
 * Testing:
 *  - Unit tests in Tests/AppleFmModuleTests.swift cover the pure helpers
 *    (reason mapping enum, error type).
 *  - The actual FM round-trip is verified in iOS Simulator (Xcode 16+
 *    on an Apple Silicon Mac with Apple Intelligence enabled) since the
 *    framework cannot be meaningfully exercised without a host context.
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
}

public enum AppleFmAvailability {
  /// Returns true only when the Foundation Models framework reports
  /// `.available`.
  public static func isAvailableNow() -> Bool {
    #if canImport(FoundationModels)
      if #available(iOS 18.1, *) {
        if case .available = SystemLanguageModel.default.availability {
          return true
        }
      }
    #endif
    return false
  }

  /// Returns a JS-friendly dictionary describing availability.
  public static func payload() -> [String: Any] {
    #if canImport(FoundationModels)
      if #available(iOS 18.1, *) {
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
    @available(iOS 18.1, *)
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
  /// Runs a polish via Apple Foundation Models. Throws
  /// `AppleFmError.unsupportedOS` on iOS < 18.1, and
  /// `AppleFmError.unavailable(reason:)` when the model itself is not
  /// ready (Apple Intelligence disabled, model still downloading, etc).
  public static func polish(prompt: String, systemPrompt: String) async throws -> String {
    #if canImport(FoundationModels)
      guard #available(iOS 18.1, *) else { throw AppleFmError.unsupportedOS }
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
