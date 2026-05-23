import XCTest
@testable import AppleFm

#if canImport(FoundationModels)
  import FoundationModels
#endif

/**
 * Unit-level tests for the Apple FoundationModels adapter.
 *
 * These exercise the pure helpers (reason mapping, availability payload
 * shape, error equality) but cannot drive a real FM round-trip — that is
 * an integration test in iOS Simulator (Xcode 16+ on an Apple Silicon
 * host with Apple Intelligence enabled).
 *
 * Run with:
 *   cd modules/apple-fm/ios
 *   xcodebuild test -workspace ../../../ios/AccessMate.xcworkspace \
 *                   -scheme AppleFm-Unit-Tests \
 *                   -destination 'platform=iOS Simulator,name=iPhone 16'
 */
final class AppleFmReasonTests: XCTestCase {
  func testRawValuesMatchTheJsContract() {
    XCTAssertEqual(AppleFmReason.unsupportedDevice.rawValue, "unsupported-device")
    XCTAssertEqual(
      AppleFmReason.appleIntelligenceNotEnabled.rawValue,
      "apple-intelligence-not-enabled"
    )
    XCTAssertEqual(AppleFmReason.modelNotReady.rawValue, "model-not-ready")
    XCTAssertEqual(AppleFmReason.unknown.rawValue, "unknown")
  }
}

final class AppleFmErrorTests: XCTestCase {
  func testUnsupportedOsEqualsItself() {
    XCTAssertEqual(AppleFmError.unsupportedOS, AppleFmError.unsupportedOS)
  }

  func testUnavailableEqualityIsReasonSensitive() {
    XCTAssertEqual(
      AppleFmError.unavailable(reason: .modelNotReady),
      AppleFmError.unavailable(reason: .modelNotReady)
    )
    XCTAssertNotEqual(
      AppleFmError.unavailable(reason: .modelNotReady),
      AppleFmError.unavailable(reason: .unsupportedDevice)
    )
  }

  func testUnsupportedOsAndUnavailableAreDifferent() {
    XCTAssertNotEqual(
      AppleFmError.unsupportedOS,
      AppleFmError.unavailable(reason: .unknown)
    )
  }
}

final class AppleFmAvailabilityPayloadTests: XCTestCase {
  /// The JS side always reads `available` first; the contract is that
  /// the key exists on every payload, regardless of platform.
  func testPayloadAlwaysIncludesAvailableKey() {
    let payload = AppleFmAvailability.payload()
    XCTAssertNotNil(payload["available"])
    if let isAvailable = payload["available"] as? Bool, !isAvailable {
      // When unavailable, reason must be set.
      XCTAssertNotNil(payload["reason"], "Unavailable payloads must include a reason")
    }
  }

  /// On non-Apple-Silicon Simulators / iOS < 18.1, availability must
  /// degrade to a documented reason — never throw or omit fields.
  func testPayloadFallsBackGracefullyOnUnsupportedHost() {
    let payload = AppleFmAvailability.payload()
    if let available = payload["available"] as? Bool, available == false {
      let reason = payload["reason"] as? String
      XCTAssertNotNil(reason)
      let allowed: Set<String> = [
        "unsupported-device",
        "apple-intelligence-not-enabled",
        "model-not-ready",
        "unknown",
      ]
      XCTAssertTrue(allowed.contains(reason ?? ""), "Unknown reason string: \(reason ?? "nil")")
    }
  }
}
