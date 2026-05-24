package com.accessmate.data

import android.content.Context
import kotlinx.serialization.json.Json

/** Loads the bundled JSON files from the app's assets directory at
 *  startup. Mirror of iOS BundledData. */
object BundledData {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    fun operators(ctx: Context): List<OperatorEntry> =
        loadDirectory(ctx, "operators")
            .map { json.decodeFromString<OperatorEntry>(it) }
            .sortedBy { it.name }

    fun scenarios(ctx: Context): List<ScenarioTemplate> =
        loadDirectory(ctx, "scenarios")
            .map { json.decodeFromString<ScenarioTemplate>(it) }
            .sortedBy { it.title }

    private fun loadDirectory(ctx: Context, folder: String): List<String> {
        val assets = ctx.assets
        val files = assets.list(folder).orEmpty()
        return files.map { name ->
            assets.open("$folder/$name").bufferedReader().use { it.readText() }
        }
    }
}
