package com.accessmate.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.accessmate.data.IncidentStatus
import com.accessmate.ui.appModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncidentsScreen(nav: NavController) {
    val vm = appModel()
    val incidents by vm.incidents.collectAsState()
    var filter by remember { mutableStateOf(IncidentStatus.in_progress) }

    val counts = IncidentStatus.entries.associateWith { s -> incidents.count { it.status == s } }
    val visible = incidents.filter { it.status == filter }.sortedByDescending { it.startedAtISO }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Incidents") }) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.error),
                ) {
                    Column(Modifier.padding(16.dp).fillMaxWidth()) {
                        Text(
                            "Start a new report",
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onError,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Tell AccessMate what happened — we'll guide you through it.",
                            color = MaterialTheme.colorScheme.onError.copy(alpha = 0.85f),
                        )
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = { nav.navigate("report") },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.surface,
                                contentColor = MaterialTheme.colorScheme.onSurface,
                            ),
                        ) { Text("Open report form") }
                    }
                }
            }

            item {
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                    listOf(
                        IncidentStatus.draft to "Drafts",
                        IncidentStatus.in_progress to "In progress",
                        IncidentStatus.completed to "Completed",
                    ).forEachIndexed { i, (status, label) ->
                        SegmentedButton(
                            selected = filter == status,
                            onClick = { filter = status },
                            shape = SegmentedButtonDefaults.itemShape(i, 3),
                        ) { Text("$label (${counts[status] ?: 0})") }
                    }
                }
            }

            if (visible.isEmpty()) {
                item {
                    Text(
                        when (filter) {
                            IncidentStatus.draft -> "No drafts. Tap Start a new report to begin."
                            IncidentStatus.in_progress -> "No incidents in progress."
                            IncidentStatus.completed -> "No completed incidents yet."
                            IncidentStatus.discarded -> ""
                        },
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            } else {
                items(visible, key = { it.id }) { inc ->
                    Card(onClick = { nav.navigate("incident/${inc.id}") }) {
                        Row(
                            Modifier
                                .padding(16.dp)
                                .fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text(
                                    inc.title ?: "Untitled incident",
                                    style = MaterialTheme.typography.titleMedium,
                                )
                                Text(
                                    listOfNotNull(
                                        inc.startedAtISO.take(10),
                                        inc.facts?.operatorName,
                                    ).joinToString(" · "),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodyMedium,
                                )
                            }
                            AssistChip(
                                onClick = {},
                                label = { Text(inc.status.name.replace('_', ' ')) },
                                enabled = false,
                            )
                        }
                    }
                }
            }
        }
    }
}
