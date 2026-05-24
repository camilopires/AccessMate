package com.accessmate.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import android.content.Intent
import androidx.navigation.NavController
import com.accessmate.data.IncidentStatus
import com.accessmate.data.PdfExport
import com.accessmate.data.Reminders
import com.accessmate.ui.appModel
import java.time.Instant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncidentDetailScreen(nav: NavController, id: String) {
    val vm = appModel()
    val incidents by vm.incidents.collectAsState()
    val inc = incidents.firstOrNull { it.id == id }
    val ctx = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(inc?.title ?: "Incident") },
                navigationIcon = {
                    TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
                },
            )
        },
    ) { padding ->
        if (inc == null) {
            Column(Modifier.padding(padding).padding(16.dp)) {
                Text("That incident no longer exists.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            return@Scaffold
        }

        Column(
            Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            AssistChip(onClick = {}, label = { Text(inc.status.name.replace('_', ' ')) }, enabled = false)
            inc.facts?.operatorName?.let { Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant) }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("TIMELINE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("${inc.startedAtISO.take(10)} — Drafted")
                    inc.sentAtISO?.let { Text("${it.take(10)} — Sent to ${inc.recipient ?: "operator"}") }
                    inc.resolvedAtISO?.let { Text("${it.take(10)} — Resolved") }
                }
            }

            inc.draftBody?.let { body ->
                Card {
                    Column(Modifier.padding(16.dp)) {
                        Text("OUTGOING LETTER", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.height(8.dp))
                        Text(body, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            when (inc.status) {
                IncidentStatus.draft -> {
                    Button(
                        onClick = {
                            val now = Instant.now().toString()
                            vm.upsertIncident(inc.copy(status = IncidentStatus.in_progress, sentAtISO = now))
                            Reminders.schedule(ctx, inc.id, inc.title ?: "your incident")
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Send to operator") }
                    OutlinedButton(
                        onClick = { vm.removeIncident(inc.id); nav.popBackStack() },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Discard draft") }
                }
                IncidentStatus.in_progress -> {
                    Button(
                        onClick = {
                            val now = Instant.now().toString()
                            vm.upsertIncident(inc.copy(status = IncidentStatus.completed, resolvedAtISO = now))
                            Reminders.cancel(ctx, inc.id)
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Mark as resolved") }
                    OutlinedButton(
                        onClick = {
                            ctx.startActivity(Intent.createChooser(PdfExport.makeAndShareIntent(ctx, inc), "Share PDF"))
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Export PDF") }
                }
                IncidentStatus.completed -> {
                    OutlinedButton(
                        onClick = {
                            ctx.startActivity(Intent.createChooser(PdfExport.makeAndShareIntent(ctx, inc), "Share PDF"))
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Export PDF") }
                    OutlinedButton(
                        onClick = { vm.upsertIncident(inc.copy(status = IncidentStatus.in_progress)) },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Re-open") }
                }
                IncidentStatus.discarded -> Unit
            }
        }
    }
}
