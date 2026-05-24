import XCTest
@testable import AccessMate

final class DraftBuilderTests: XCTestCase {
    func testAssembleIncludesEveryFactSection() throws {
        let template = ScenarioTemplate(
            id: "missed-passenger-assist",
            title: "Missed Passenger Assist",
            mode: .rail,
            emailSubject: "Test",
            header: "Header for {{operator}} on {{date}}.",
            legalParagraph: "Legal text.",
            ask: "Investigate.",
            regulator: .orr
        )
        let op = OperatorEntry(
            id: "avanti-west-coast",
            name: "Avanti West Coast",
            mode: .rail,
            assistance: OperatorAssistance(phone: "+44", bookingUrl: nil, accessibilityPageUrl: nil),
            complaintsRoute: OperatorComplaintsRoute(primaryEmail: "x@y", primaryUrl: nil, regulator: .orr),
            lastVerifiedUTC: "2026-05-24T00:00:00Z"
        )
        let facts = IncidentFacts(
            whenISO: "2026-05-24T12:00:00Z",
            operatorName: "Avanti West Coast",
            scenarioId: "missed-passenger-assist",
            narrative: nil,
            accompanied: false,
            staffInteractions: nil,
            witnesses: nil,
            waitedMinutes: nil
        )
        let body = DraftBuilder.assemble(template: template, facts: facts, op: op, profile: nil)
        XCTAssertTrue(body.contains("Avanti West Coast"))
        XCTAssertTrue(body.contains("2026-05-24"))
        XCTAssertTrue(body.contains("Travelling alone"))
        XCTAssertTrue(body.contains("Legal text."))
        XCTAssertTrue(body.contains("Investigate."))
    }
}
