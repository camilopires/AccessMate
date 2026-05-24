package com.accessmate

import com.accessmate.data.*
import org.junit.Assert.assertTrue
import org.junit.Test

class DraftBuilderTest {
    @Test
    fun assembleIncludesEveryFactSection() {
        val template = ScenarioTemplate(
            id = "missed-passenger-assist",
            title = "Missed Passenger Assist",
            mode = "rail",
            emailSubject = "Test",
            header = "Header for {{operator}} on {{date}}.",
            legalParagraph = "Legal text.",
            ask = "Investigate.",
            regulator = "orr",
        )
        val op = OperatorEntry(
            id = "avanti-west-coast",
            name = "Avanti West Coast",
            mode = "rail",
            assistance = OperatorAssistance(phone = "+44"),
            complaintsRoute = OperatorComplaintsRoute(primaryEmail = "x@y", regulator = "orr"),
            lastVerifiedUTC = "2026-05-24T00:00:00Z",
        )
        val facts = IncidentFacts(
            whenISO = "2026-05-24T12:00:00Z",
            operatorName = "Avanti West Coast",
            scenarioId = "missed-passenger-assist",
            accompanied = false,
        )
        val body = DraftBuilder.assemble(template, facts, op, null)
        assertTrue(body.contains("Avanti West Coast"))
        assertTrue(body.contains("2026-05-24"))
        assertTrue(body.contains("Travelling alone"))
        assertTrue(body.contains("Legal text."))
        assertTrue(body.contains("Investigate."))
    }
}
