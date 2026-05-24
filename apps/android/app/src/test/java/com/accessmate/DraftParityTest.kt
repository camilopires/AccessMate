package com.accessmate

import com.accessmate.data.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.File

class DraftParityTest {

    @Serializable
    private data class FixtureCase(
        val name: String,
        val template: ScenarioTemplate,
        val facts: IncidentFacts,
        val `operator`: OperatorEntry? = null,
        val profile: Profile? = null,
        val expected: String,
    )

    @Serializable
    private data class FixtureFile(val cases: List<FixtureCase>)

    @Test
    fun everyFixtureCaseProducesByteIdenticalDraft() {
        // Walk up from this test source to the shared fixture path.
        val here = File(System.getProperty("user.dir"))  // apps/android
        val fixture = File(here, "../../packages/shared/test-fixtures/draft-cases.json")
            .normalize()
        val raw = fixture.readText()
        val json = Json { ignoreUnknownKeys = true; isLenient = true }
        val file = json.decodeFromString(FixtureFile.serializer(), raw)
        for (c in file.cases) {
            val actual = DraftBuilder.assemble(c.template, c.facts, c.`operator`, c.profile)
            assertEquals("case ${c.name} drifted from canonical output", c.expected, actual)
        }
    }
}
