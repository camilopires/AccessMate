package com.accessmate.ui

import android.app.Application
import androidx.compose.runtime.compositionLocalOf
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.runtime.Composable
import com.accessmate.data.AppStore
import com.accessmate.data.BundledData
import com.accessmate.data.OperatorEntry
import com.accessmate.data.ScenarioTemplate
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import com.accessmate.data.Incident
import com.accessmate.data.Profile
import com.accessmate.data.Settings
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

class AppViewModel(app: Application) : AndroidViewModel(app) {
    private val store = AppStore(app)
    val operators: List<OperatorEntry> = BundledData.operators(app)
    val scenarios: List<ScenarioTemplate> = BundledData.scenarios(app)

    val incidents: StateFlow<List<Incident>> = store.incidentsFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, emptyList()
    )
    val profile: StateFlow<Profile> = store.profileFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, Profile()
    )
    val settings: StateFlow<Settings> = store.settingsFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, Settings()
    )

    fun upsertIncident(inc: Incident) = viewModelScope.launch { store.upsertIncident(inc) }
    fun removeIncident(id: String) = viewModelScope.launch { store.removeIncident(id) }
    fun saveProfile(p: Profile) = viewModelScope.launch { store.saveProfile(p) }
    fun saveSettings(s: Settings) = viewModelScope.launch { store.saveSettings(s) }
}

@Composable
fun appModel(): AppViewModel = viewModel()
