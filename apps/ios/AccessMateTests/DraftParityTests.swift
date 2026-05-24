import XCTest
@testable import AccessMate

/// Loads packages/shared/test-fixtures/draft-cases.json and asserts the
/// iOS DraftBuilder produces byte-identical output to the canonical
/// expected string for every case. Same fixture is consumed by the
/// web (Bun) and Android (JUnit) suites.
final class DraftParityTests: XCTestCase {

    private struct FixtureFile: Decodable { let cases: [FixtureCase] }
    private struct FixtureCase: Decodable {
        let name: String
        let template: ScenarioTemplate
        let facts: IncidentFacts
        let `operator`: OperatorEntry?
        let profile: Profile?
        let expected: String
    }

    func testEveryFixtureCaseProducesByteIdenticalDraft() throws {
        // The fixture lives outside the iOS app — point at the repo path
        // from BUILT_PRODUCTS_DIR via SOURCE_ROOT.
        let bundle = Bundle(for: type(of: self))
        let url = bundle.url(forResource: "draft-cases", withExtension: "json")
            ?? Self.repoFixtureURL()
        let data = try Data(contentsOf: url)
        let file = try JSONDecoder().decode(FixtureFile.self, from: data)

        for c in file.cases {
            let actual = DraftBuilder.assemble(
                template: c.template,
                facts: c.facts,
                op: c.`operator`,
                profile: c.profile
            )
            XCTAssertEqual(actual, c.expected, "case \(c.name) drifted from canonical output")
        }
    }

    /// Fallback path for CI / xcodebuild — looks up the fixture by
    /// walking up from the test target's source root.
    private static func repoFixtureURL() -> URL {
        let source = URL(fileURLWithPath: #filePath)
        return source
            .deletingLastPathComponent() // AccessMateTests
            .deletingLastPathComponent() // ios
            .deletingLastPathComponent() // apps
            .appendingPathComponent("packages/shared/test-fixtures/draft-cases.json")
    }
}
