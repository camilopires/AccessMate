package com.accessmate.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.accessmate.ui.appModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PassportScreen(nav: NavController) {
    val vm = appModel()
    val profile by vm.profile.collectAsState()

    Scaffold(topBar = { TopAppBar(title = { Text("Accessibility passport") }) }) { padding ->
        Column(
            Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            if (profile.isEmpty) {
                Card {
                    Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Set up your passport", style = MaterialTheme.typography.headlineSmall)
                        Text("Staff can see your access needs at a glance. Takes about 90 seconds and stays on your device.")
                        Button(
                            onClick = { nav.navigate("profile/edit") },
                            modifier = Modifier.fillMaxWidth(),
                        ) { Text("Set up passport") }
                        Text(
                            "You can skip anything and come back later.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            } else {
                profile.mobility?.let { m ->
                    Card {
                        Column(Modifier.padding(16.dp)) {
                            Text("MOBILITY", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            when (m.wheelchairType) {
                                "powered" -> Text("Powered wheelchair")
                                "manual" -> Text("Manual wheelchair")
                                "mobility-scooter" -> Text("Mobility scooter")
                            }
                        }
                    }
                }
                profile.sensory?.let { s ->
                    Card {
                        Column(Modifier.padding(16.dp)) {
                            Text("SENSORY", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            if (s.isBlind == true) Text("Blind")
                            if (s.isLowVision == true) Text("Low vision")
                            if (s.isDeaf == true) Text("Deaf")
                            if (s.isHardOfHearing == true) Text("Hard of hearing")
                        }
                    }
                }
                profile.communication?.let { c ->
                    Card {
                        Column(Modifier.padding(16.dp)) {
                            Text("COMMUNICATION", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            if (c.prefersBSL == true) Text("Prefers British Sign Language")
                            if (c.prefersWriting == true) Text("Prefers written communication")
                            if (c.needsExtraTime == true) Text("Needs extra time")
                        }
                    }
                }
                profile.notes?.takeIf { it.isNotBlank() }?.let { n ->
                    Card {
                        Column(Modifier.padding(16.dp)) {
                            Text("NOTES", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(n)
                        }
                    }
                }
                OutlinedButton(
                    onClick = { nav.navigate("profile/edit") },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Edit profile") }
            }
        }
    }
}
