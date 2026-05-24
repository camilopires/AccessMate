import SwiftUI

/// On iOS 26+ with Apple Foundation Models available, the Report flow
/// runs as a chat with the on-device LLM. The user can switch to the
/// 4-step form at any time without losing what they've said.
struct ConversationalReportScreen: View {
    @EnvironmentObject var stores: Stores
    @Environment(\.dismiss) private var dismiss
    @StateObject private var fm = AppleFMSession()

    @State private var bubbles: [Bubble] = []
    @State private var draft = ""
    @State private var capturedFacts: IncidentFacts? = nil
    @State private var switchedToForm = false

    let onCreated: (String) -> Void

    struct Bubble: Identifiable {
        let id = UUID()
        let role: Role
        let text: String
        enum Role { case user, assistant }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button("Cancel") { dismiss() }
                Spacer()
                Text("New report").font(.headline)
                Spacer()
                Button("Use the form") { switchedToForm = true }
            }
            .padding()
            .background(Theme.paper)

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 8) {
                    ForEach(bubbles) { b in
                        HStack {
                            if b.role == .user { Spacer() }
                            Text(b.text)
                                .padding(12)
                                .background(
                                    b.role == .user ? Theme.accentDeep : Theme.raised
                                )
                                .foregroundStyle(b.role == .user ? .white : Theme.ink)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                            if b.role == .assistant { Spacer() }
                        }
                    }
                    if case .thinking = fm.state {
                        Text("…thinking").italic().foregroundStyle(Theme.inkMuted)
                    }
                }
                .padding()
            }
            .background(Theme.paper)

            HStack(spacing: 12) {
                TextField("Type your message", text: $draft, axis: .vertical)
                    .lineLimit(1...4)
                    .textFieldStyle(.roundedBorder)
                Button {
                    Task { await sendMessage() }
                } label: {
                    Image(systemName: "paperplane.fill").imageScale(.large)
                }
                .buttonStyle(.borderedProminent)
                .disabled(draft.isEmpty || isThinking)
            }
            .padding()
            .background(Theme.paper)
        }
        .background(Theme.paper)
        .task { await begin() }
        .sheet(isPresented: $switchedToForm) {
            NavigationStack {
                ReportScreen(initialFacts: capturedFacts) { id in
                    switchedToForm = false
                    onCreated(id)
                }
            }
        }
    }

    private var isThinking: Bool {
        if case .thinking = fm.state { return true }
        return false
    }

    private func begin() async {
        await fm.start()
        if case .unsupported = fm.state {
            // Should never appear — the parent only mounts this screen when
            // AppleFMSession.isAvailable() returned true. Bail to the form.
            switchedToForm = true
            return
        }
        let reply = await fm.send("Greet the user and ask the first question.")
        if let r = reply {
            bubbles.append(Bubble(role: .assistant, text: r.assistantText))
        }
    }

    private func sendMessage() async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        bubbles.append(Bubble(role: .user, text: text))
        draft = ""

        let reply = await fm.send(text)
        guard let r = reply else { return }
        bubbles.append(Bubble(role: .assistant, text: r.assistantText))
        if let f = r.facts {
            capturedFacts = mergeFacts(capturedFacts, f)
        }
        if r.isComplete, let f = capturedFacts ?? r.facts {
            finalize(with: f)
        }
    }

    private func finalize(with facts: IncidentFacts) {
        let template = BundledData.scenarios.first { $0.id == facts.scenarioId }
            ?? BundledData.scenarios.first!
        let op = BundledData.operators.first { $0.name == facts.operatorName }
        let body = DraftBuilder.assemble(template: template, facts: facts, op: op, profile: stores.profile.profile)
        let inc = Incident(
            id: UUID().uuidString,
            status: .draft,
            startedAtISO: facts.whenISO ?? ISO8601DateFormatter().string(from: Date()),
            title: "\(template.title)\(op.map { " — \($0.name)" } ?? "")",
            facts: facts,
            templateId: template.id,
            draftBody: body,
            recipient: op?.complaintsRoute.primaryEmail,
            operatorId: op?.id,
            sentAtISO: nil,
            resolvedAtISO: nil
        )
        stores.incidents.upsert(inc)
        onCreated(inc.id)
        dismiss()
    }

    private func mergeFacts(_ a: IncidentFacts?, _ b: IncidentFacts) -> IncidentFacts {
        guard var out = a else { return b }
        if let v = b.whenISO { out.whenISO = v }
        if let v = b.operatorName { out.operatorName = v }
        if let v = b.scenarioId { out.scenarioId = v }
        if let v = b.narrative { out.narrative = v }
        if let v = b.accompanied { out.accompanied = v }
        if let v = b.staffInteractions { out.staffInteractions = v }
        if let v = b.witnesses { out.witnesses = v }
        if let v = b.waitedMinutes { out.waitedMinutes = v }
        return out
    }
}
