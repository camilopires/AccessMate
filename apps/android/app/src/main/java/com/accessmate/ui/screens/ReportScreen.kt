package com.accessmate.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.accessmate.data.DraftBuilder
import com.accessmate.data.Incident
import com.accessmate.data.IncidentFacts
import com.accessmate.data.IncidentStatus
import com.accessmate.ui.appModel
import java.time.Instant
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportScreen(nav: NavController) {
    val vm = appModel()
    val operators = vm.operators
    val scenarios = vm.scenarios

    var selectedOp by remember { mutableStateOf(operators.firstOrNull()?.id) }
    var selectedScenario by remember { mutableStateOf(scenarios.firstOrNull()?.id) }
    var accompanied: Boolean? by remember { mutableStateOf(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("New report") },
                navigationIcon = {
                    TextButton(onClick = { nav.popBackStack() }) { Text("Cancel") }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Which operator?", style = MaterialTheme.typography.titleSmall)
                    DropdownPicker(
                        label = "Operator",
                        options = operators.map { it.id to it.name },
                        selected = selectedOp,
                        onSelect = { selectedOp = it },
                    )

                    Text("What kind of failure?", style = MaterialTheme.typography.titleSmall)
                    DropdownPicker(
                        label = "Scenario",
                        options = scenarios.map { it.id to it.title },
                        selected = selectedScenario,
                        onSelect = { selectedScenario = it },
                    )

                    Text("Were you alone or accompanied?", style = MaterialTheme.typography.titleSmall)
                    SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                        SegmentedButton(
                            selected = accompanied == false,
                            onClick = { accompanied = false },
                            shape = SegmentedButtonDefaults.itemShape(0, 2),
                        ) { Text("Alone") }
                        SegmentedButton(
                            selected = accompanied == true,
                            onClick = { accompanied = true },
                            shape = SegmentedButtonDefaults.itemShape(1, 2),
                        ) { Text("With companion") }
                    }
                }
            }

            Button(
                enabled = selectedOp != null && selectedScenario != null,
                onClick = {
                    val op = operators.firstOrNull { it.id == selectedOp } ?: return@Button
                    val tpl = scenarios.firstOrNull { it.id == selectedScenario } ?: return@Button
                    val now = Instant.now().toString()
                    val facts = IncidentFacts(
                        whenISO = now,
                        operatorName = op.name,
                        scenarioId = tpl.id,
                        accompanied = accompanied,
                    )
                    val body = DraftBuilder.assemble(tpl, facts, op, vm.profile.value)
                    val inc = Incident(
                        id = UUID.randomUUID().toString(),
                        status = IncidentStatus.draft,
                        startedAtISO = now,
                        title = "${tpl.title} — ${op.name}",
                        facts = facts,
                        templateId = tpl.id,
                        draftBody = body,
                        recipient = op.complaintsRoute.primaryEmail,
                        operatorId = op.id,
                    )
                    vm.upsertIncident(inc)
                    nav.navigate("incident/${inc.id}") {
                        popUpTo("report") { inclusive = true }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Draft complaint") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DropdownPicker(
    label: String,
    options: List<Pair<String, String>>,
    selected: String?,
    onSelect: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    val current = options.firstOrNull { it.first == selected }?.second ?: ""

    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
        TextField(
            value = current,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor(),
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { (id, label) ->
                DropdownMenuItem(
                    text = { Text(label) },
                    onClick = {
                        onSelect(id)
                        expanded = false
                    },
                )
            }
        }
    }
}
