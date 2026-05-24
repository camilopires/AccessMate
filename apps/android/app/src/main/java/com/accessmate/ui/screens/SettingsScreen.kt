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
import com.accessmate.ui.appModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen() {
    val vm = appModel()
    val s by vm.settings.collectAsState()

    Scaffold(topBar = { TopAppBar(title = { Text("Settings") }) }) { padding ->
        Column(
            Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("ACCESSIBILITY", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("High contrast", Modifier.weight(1f))
                        Switch(checked = s.highContrast, onCheckedChange = { vm.saveSettings(s.copy(highContrast = it)) })
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Reduce motion", Modifier.weight(1f))
                        Switch(checked = s.reduceMotion, onCheckedChange = { vm.saveSettings(s.copy(reduceMotion = it)) })
                    }
                    Text("Font scale · %.1fx".format(s.fontScale), style = MaterialTheme.typography.bodyMedium)
                    Slider(
                        value = s.fontScale,
                        onValueChange = { vm.saveSettings(s.copy(fontScale = it)) },
                        valueRange = 1f..2f,
                        steps = 8,
                    )
                }
            }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("ABOUT", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("AccessMate is an accessibility-first travel companion. All data stays on your device unless you explicitly share or export it.")
                }
            }
        }
    }
}
