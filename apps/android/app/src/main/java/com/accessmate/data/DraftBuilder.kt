package com.accessmate.data

import java.time.Instant

/** Mirror of `assembleDraft` in packages/shared and iOS DraftBuilder. */
object DraftBuilder {
    fun assemble(
        template: ScenarioTemplate,
        facts: IncidentFacts,
        op: OperatorEntry?,
        profile: Profile?,
    ): String {
        val date = (facts.whenISO ?: Instant.now().toString()).take(10)
        val operatorName = op?.name ?: facts.operatorName ?: "the operator"

        fun fill(s: String): String =
            s.replace("{{operator}}", operatorName)
                .replace("{{date}}", date)
                .replace("{{location}}", "the location described above")

        val about = buildList {
            when (profile?.mobility?.wheelchairType) {
                "powered" -> add("- Powered wheelchair user.")
                "manual" -> add("- Manual wheelchair user.")
                "mobility-scooter" -> add("- Mobility scooter user.")
            }
            if (profile?.sensory?.isBlind == true) add("- Blind.")
            if (profile?.sensory?.isLowVision == true) add("- Low vision.")
            if (profile?.sensory?.isDeaf == true) add("- Deaf.")
            if (profile?.sensory?.isHardOfHearing == true) add("- Hard of hearing.")
            if (profile?.communication?.prefersBSL == true) add("- Prefers British Sign Language.")
            if (profile?.communication?.prefersWriting == true) add("- Prefers written communication.")
            if (profile?.communication?.needsExtraTime == true) add("- Needs extra time.")
        }

        val aboutMe = if (about.isEmpty()) {
            "No specific accessibility profile shared for this complaint."
        } else {
            about.joinToString("\n")
        }

        val factLines = buildList {
            add("- Date: $date.")
            add("- Operator: $operatorName.")
            when (facts.accompanied) {
                true -> add("- Travelling with a companion.")
                false -> add("- Travelling alone.")
                null -> Unit
            }
            facts.staffInteractions?.takeIf { it.isNotBlank() }?.let { add("- Staff interactions: $it.") }
            facts.witnesses?.takeIf { it.isNotBlank() }?.let { add("- Witnesses: $it.") }
            facts.waitedMinutes?.let { add("- Waited approximately $it minutes.") }
            facts.narrative?.takeIf { it.isNotBlank() }?.let { add("- Summary: $it.") }
        }

        return listOf(
            "# ${template.title}",
            "",
            fill(template.header),
            "",
            "## What happened",
            "",
            factLines.joinToString("\n"),
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
        ).joinToString("\n")
    }
}
