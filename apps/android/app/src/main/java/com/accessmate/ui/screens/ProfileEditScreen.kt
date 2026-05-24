package com.accessmate.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.accessmate.data.Profile
import com.accessmate.data.ProfileCommunication
import com.accessmate.data.ProfileMobility
import com.accessmate.data.ProfileSensory
import com.accessmate.ui.appModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileEditScreen(nav: NavController) {
    val vm = appModel()
    val current by vm.profile.collectAsState()
    var draft by remember(current) { mutableStateOf(current) }
    var wheelchair by remember(current) { mutableStateOf(current.mobility?.wheelchairType ?: "none") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Your accessibility profile") },
                navigationIcon = { TextButton(onClick = { nav.popBackStack() }) { Text("Cancel") } },
                actions = {
                    TextButton(onClick = {
                        val mobility = if (wheelchair == "none") null
                        else ProfileMobility(usesWheelchair = true, wheelchairType = wheelchair)
                        vm.saveProfile(draft.copy(mobility = mobility))
                        nav.popBackStack()
                    }) { Text("Save") }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier.padding(padding).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("MOBILITY", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    listOf(
                        "none" to "None",
                        "manual" to "Manual wheelchair",
                        "powered" to "Powered wheelchair",
                        "mobility-scooter" to "Mobility scooter",
                    ).forEach { (id, label) ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = wheelchair == id, onClick = { wheelchair = id })
                            Text(label, Modifier.padding(start = 8.dp))
                        }
                    }
                }
            }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("SENSORY", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    SwitchRow("Blind", draft.sensory?.isBlind == true) { v ->
                        draft = draft.copy(sensory = (draft.sensory ?: ProfileSensory()).copy(isBlind = v))
                    }
                    SwitchRow("Low vision", draft.sensory?.isLowVision == true) { v ->
                        draft = draft.copy(sensory = (draft.sensory ?: ProfileSensory()).copy(isLowVision = v))
                    }
                    SwitchRow("Deaf", draft.sensory?.isDeaf == true) { v ->
                        draft = draft.copy(sensory = (draft.sensory ?: ProfileSensory()).copy(isDeaf = v))
                    }
                    SwitchRow("Hard of hearing", draft.sensory?.isHardOfHearing == true) { v ->
                        draft = draft.copy(sensory = (draft.sensory ?: ProfileSensory()).copy(isHardOfHearing = v))
                    }
                }
            }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("COMMUNICATION", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    SwitchRow("Prefers British Sign Language", draft.communication?.prefersBSL == true) { v ->
                        draft = draft.copy(communication = (draft.communication ?: ProfileCommunication()).copy(prefersBSL = v))
                    }
                    SwitchRow("Prefers written communication", draft.communication?.prefersWriting == true) { v ->
                        draft = draft.copy(communication = (draft.communication ?: ProfileCommunication()).copy(prefersWriting = v))
                    }
                    SwitchRow("Needs extra time", draft.communication?.needsExtraTime == true) { v ->
                        draft = draft.copy(communication = (draft.communication ?: ProfileCommunication()).copy(needsExtraTime = v))
                    }
                }
            }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("NOTES", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    OutlinedTextField(
                        value = draft.notes ?: "",
                        onValueChange = { draft = draft.copy(notes = it.ifBlank { null }) },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp),
                        placeholder = { Text("Notes staff might find useful") },
                    )
                }
            }
        }
    }
}

@Composable
private fun SwitchRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(label, Modifier.weight(1f))
        Switch(checked = checked, onCheckedChange = onChange)
    }
}
