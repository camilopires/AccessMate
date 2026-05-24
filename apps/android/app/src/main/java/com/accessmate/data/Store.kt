package com.accessmate.data

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.dataStore by preferencesDataStore(name = "accessmate")

class AppStore(private val ctx: Context) {
    private val json = Json { ignoreUnknownKeys = true }

    private val incidentsKey = stringPreferencesKey("incidents.v1")
    private val profileKey = stringPreferencesKey("profile.v1")
    private val settingsKey = stringPreferencesKey("settings.v1")

    val incidentsFlow: Flow<List<Incident>> = ctx.dataStore.data.map { prefs: Preferences ->
        prefs[incidentsKey]?.let { runCatching { json.decodeFromString<List<Incident>>(it) }.getOrNull() } ?: emptyList()
    }

    val profileFlow: Flow<Profile> = ctx.dataStore.data.map { prefs ->
        prefs[profileKey]?.let { runCatching { json.decodeFromString<Profile>(it) }.getOrNull() } ?: Profile()
    }

    val settingsFlow: Flow<Settings> = ctx.dataStore.data.map { prefs ->
        prefs[settingsKey]?.let { runCatching { json.decodeFromString<Settings>(it) }.getOrNull() } ?: Settings()
    }

    suspend fun upsertIncident(inc: Incident) {
        ctx.dataStore.edit { prefs ->
            val list = prefs[incidentsKey]?.let { runCatching { json.decodeFromString<List<Incident>>(it) }.getOrNull() } ?: emptyList()
            val updated = list.toMutableList().apply {
                val idx = indexOfFirst { it.id == inc.id }
                if (idx >= 0) set(idx, inc) else add(inc)
            }
            prefs[incidentsKey] = json.encodeToString(updated)
        }
    }

    suspend fun removeIncident(id: String) {
        ctx.dataStore.edit { prefs ->
            val list = prefs[incidentsKey]?.let { runCatching { json.decodeFromString<List<Incident>>(it) }.getOrNull() } ?: emptyList()
            prefs[incidentsKey] = json.encodeToString(list.filter { it.id != id })
        }
    }

    suspend fun saveProfile(p: Profile) {
        ctx.dataStore.edit { prefs -> prefs[profileKey] = json.encodeToString(p) }
    }

    suspend fun saveSettings(s: Settings) {
        ctx.dataStore.edit { prefs -> prefs[settingsKey] = json.encodeToString(s) }
    }
}
