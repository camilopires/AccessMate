package com.accessmate.data

import kotlinx.serialization.Serializable

@Serializable
data class OperatorEntry(
    val id: String,
    val name: String,
    val mode: String,
    val assistance: OperatorAssistance,
    val complaintsRoute: OperatorComplaintsRoute,
    val lastVerifiedUTC: String,
)

@Serializable
data class OperatorAssistance(
    val phone: String,
    val bookingUrl: String? = null,
    val accessibilityPageUrl: String? = null,
)

@Serializable
data class OperatorComplaintsRoute(
    val primaryEmail: String? = null,
    val primaryUrl: String? = null,
    val regulator: String,
)

@Serializable
data class ScenarioTemplate(
    val id: String,
    val title: String,
    val mode: String,
    val emailSubject: String,
    val header: String,
    val legalParagraph: String,
    val ask: String,
    val regulator: String,
)

@Serializable
data class IncidentFacts(
    val whenISO: String? = null,
    val operatorName: String? = null,
    val scenarioId: String? = null,
    val narrative: String? = null,
    val accompanied: Boolean? = null,
    val staffInteractions: String? = null,
    val witnesses: String? = null,
    val waitedMinutes: Int? = null,
)

enum class IncidentStatus { draft, in_progress, completed, discarded }

@Serializable
data class Incident(
    val id: String,
    val status: IncidentStatus,
    val startedAtISO: String,
    val title: String? = null,
    val facts: IncidentFacts? = null,
    val templateId: String? = null,
    val draftBody: String? = null,
    val recipient: String? = null,
    val operatorId: String? = null,
    val sentAtISO: String? = null,
    val resolvedAtISO: String? = null,
)

@Serializable
data class ProfileMobility(
    val usesWheelchair: Boolean? = null,
    val wheelchairType: String? = null,
)

@Serializable
data class ProfileSensory(
    val isBlind: Boolean? = null,
    val isLowVision: Boolean? = null,
    val isDeaf: Boolean? = null,
    val isHardOfHearing: Boolean? = null,
)

@Serializable
data class ProfileCommunication(
    val prefersBSL: Boolean? = null,
    val prefersWriting: Boolean? = null,
    val needsExtraTime: Boolean? = null,
)

@Serializable
data class Profile(
    val mobility: ProfileMobility? = null,
    val sensory: ProfileSensory? = null,
    val communication: ProfileCommunication? = null,
    val notes: String? = null,
) {
    val isEmpty: Boolean
        get() = mobility == null && sensory == null && communication == null && notes.isNullOrBlank()
}

@Serializable
data class Settings(
    val fontScale: Float = 1f,
    val highContrast: Boolean = false,
    val reduceMotion: Boolean = false,
)
