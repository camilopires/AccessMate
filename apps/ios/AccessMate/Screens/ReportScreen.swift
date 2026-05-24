import SwiftUI

struct ReportScreen: View {
    @EnvironmentObject var stores: Stores
    @Environment(\.dismiss) private var dismiss

    let onCreated: (String) -> Void

    @State private var whenDate: Date = Date()
    @State private var selectedOperatorId: String?
    @State private var selectedScenarioId: String?
    @State private var accompanied: Bool?

    var body: some View {
        Form {
            Section("When did this happen?") {
                DatePicker("Date", selection: $whenDate, displayedComponents: .date)
            }

            Section("Which operator?") {
                Picker("Operator", selection: $selectedOperatorId) {
                    Text("— Pick an operator —").tag(String?.none)
                    ForEach(BundledData.operators) { op in
                        Text(op.name).tag(String?.some(op.id))
                    }
                }
            }

            Section("What kind of failure?") {
                Picker("Scenario", selection: $selectedScenarioId) {
                    Text("— Pick a scenario —").tag(String?.none)
                    ForEach(BundledData.scenarios) { sc in
                        Text(sc.title).tag(String?.some(sc.id))
                    }
                }
            }

            Section("Were you alone or accompanied?") {
                Picker("Companion", selection: $accompanied) {
                    Text("Pick one").tag(Bool?.none)
                    Text("Alone").tag(Bool?.some(false))
                    Text("With a companion").tag(Bool?.some(true))
                }
                .pickerStyle(.segmented)
            }

            Section {
                Button {
                    if let inc = buildIncident() {
                        stores.incidents.upsert(inc)
                        onCreated(inc.id)
                        dismiss()
                    }
                } label: {
                    Label("Draft complaint", systemImage: "doc.text.fill")
                        .frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(selectedOperatorId == nil || selectedScenarioId == nil)
            }
        }
        .navigationTitle("New report")
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") { dismiss() }
            }
        }
    }

    private func buildIncident() -> Incident? {
        guard
            let opId = selectedOperatorId,
            let scId = selectedScenarioId,
            let op = BundledData.operators.first(where: { $0.id == opId }),
            let tpl = BundledData.scenarios.first(where: { $0.id == scId })
        else {
            return nil
        }
        let iso = ISO8601DateFormatter()
        let when = iso.string(from: whenDate)
        let facts = IncidentFacts(
            whenISO: when,
            operatorName: op.name,
            scenarioId: tpl.id,
            narrative: nil,
            accompanied: accompanied,
            staffInteractions: nil,
            witnesses: nil,
            waitedMinutes: nil
        )
        let body = DraftBuilder.assemble(template: tpl, facts: facts, op: op, profile: stores.profile.profile)
        return Incident(
            id: UUID().uuidString,
            status: .draft,
            startedAtISO: when,
            title: "\(tpl.title) — \(op.name)",
            facts: facts,
            templateId: tpl.id,
            draftBody: body,
            recipient: op.complaintsRoute.primaryEmail,
            operatorId: op.id,
            sentAtISO: nil,
            resolvedAtISO: nil
        )
    }
}
