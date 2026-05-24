import Foundation

/// Mirror of `assembleDraft` in `packages/shared/src/index.ts`. Every
/// platform must produce the same draft body for the same inputs.
enum DraftBuilder {
    static func assemble(
        template: ScenarioTemplate,
        facts: IncidentFacts,
        op: OperatorEntry?,
        profile: Profile?
    ) -> String {
        let date = String((facts.whenISO ?? ISO8601DateFormatter().string(from: Date())).prefix(10))
        let operatorName = op?.name ?? facts.operatorName ?? "the operator"

        func fill(_ s: String) -> String {
            s
                .replacingOccurrences(of: "{{operator}}", with: operatorName)
                .replacingOccurrences(of: "{{date}}", with: date)
                .replacingOccurrences(of: "{{location}}", with: "the location described above")
        }

        var aboutLines: [String] = []
        if let m = profile?.mobility {
            switch m.wheelchairType {
            case "powered":           aboutLines.append("- Powered wheelchair user.")
            case "manual":            aboutLines.append("- Manual wheelchair user.")
            case "mobility-scooter":  aboutLines.append("- Mobility scooter user.")
            default: break
            }
        }
        if profile?.sensory?.isBlind == true            { aboutLines.append("- Blind.") }
        if profile?.sensory?.isLowVision == true        { aboutLines.append("- Low vision.") }
        if profile?.sensory?.isDeaf == true             { aboutLines.append("- Deaf.") }
        if profile?.sensory?.isHardOfHearing == true    { aboutLines.append("- Hard of hearing.") }
        if profile?.communication?.prefersBSL == true   { aboutLines.append("- Prefers British Sign Language.") }
        if profile?.communication?.prefersWriting == true { aboutLines.append("- Prefers written communication.") }
        if profile?.communication?.needsExtraTime == true { aboutLines.append("- Needs extra time.") }

        let aboutMe = aboutLines.isEmpty
            ? "No specific accessibility profile shared for this complaint."
            : aboutLines.joined(separator: "\n")

        var factLines: [String] = [
            "- Date: \(date).",
            "- Operator: \(operatorName).",
        ]
        if facts.accompanied == true  { factLines.append("- Travelling with a companion.") }
        if facts.accompanied == false { factLines.append("- Travelling alone.") }
        if let s = facts.staffInteractions, !s.isEmpty { factLines.append("- Staff interactions: \(s).") }
        if let w = facts.witnesses, !w.isEmpty          { factLines.append("- Witnesses: \(w).") }
        if let m = facts.waitedMinutes                  { factLines.append("- Waited approximately \(m) minutes.") }
        if let n = facts.narrative, !n.isEmpty          { factLines.append("- Summary: \(n).") }

        return [
            "# \(template.title)",
            "",
            fill(template.header),
            "",
            "## What happened",
            "",
            factLines.joined(separator: "\n"),
            "",
            "## About me",
            "",
            aboutMe,
            "",
            "## Legal context",
            "",
            fill(template.legalParagraph),
            "",
            "## What I want",
            "",
            fill(template.ask),
            "",
        ].joined(separator: "\n")
    }
}
