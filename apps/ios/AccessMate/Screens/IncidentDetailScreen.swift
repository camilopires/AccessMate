import SwiftUI

struct IncidentDetailScreen: View {
    @EnvironmentObject var stores: Stores
    @Environment(\.dismiss) private var dismiss
    let incidentId: String

    var body: some View {
        if let inc = stores.incidents.all.first(where: { $0.id == incidentId }) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(inc.startedAtISO.prefix(10).uppercased())
                            .font(.system(size: 12, weight: .semibold))
                            .tracking(1.4)
                            .foregroundStyle(Theme.inkMuted)
                        Text(inc.title ?? "Untitled incident")
                            .font(.system(size: 26, weight: .bold, design: .serif))
                    }

                    HStack {
                        StatusBadge(status: inc.status.rawValue)
                        if let op = inc.facts?.operatorName {
                            Text(op).foregroundStyle(Theme.inkMuted)
                        }
                    }

                    CardSurface {
                        VStack(alignment: .leading, spacing: 6) {
                            SectionLabel(text: "Timeline")
                            Text("\(inc.startedAtISO.prefix(10)) — Drafted").font(.system(size: 14))
                            if let s = inc.sentAtISO {
                                Text("\(s.prefix(10)) — Sent to \(inc.recipient ?? "operator")").font(.system(size: 14))
                            }
                            if let r = inc.resolvedAtISO {
                                Text("\(r.prefix(10)) — Resolved").font(.system(size: 14))
                            }
                        }
                    }

                    if let body = inc.draftBody {
                        CardSurface {
                            VStack(alignment: .leading, spacing: 6) {
                                SectionLabel(text: "Outgoing letter")
                                Text(body)
                                    .font(.system(size: 14, design: .serif))
                            }
                        }
                    }

                    actions(for: inc)
                }
                .padding(20)
            }
            .background(Theme.paper)
        } else {
            VStack(spacing: 12) {
                Text("Incident not found")
                Button("Back to Incidents") { dismiss() }
            }
        }
    }

    @ViewBuilder
    private func actions(for inc: Incident) -> some View {
        VStack(spacing: 12) {
            if inc.status == .draft {
                Button {
                    let now = ISO8601DateFormatter().string(from: Date())
                    var next = inc; next.status = .in_progress; next.sentAtISO = now
                    stores.incidents.upsert(next)
                } label: {
                    Label("Send to operator", systemImage: "paperplane.fill").frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

                Button(role: .destructive) {
                    stores.incidents.remove(id: inc.id)
                    dismiss()
                } label: {
                    Label("Discard draft", systemImage: "trash")
                        .frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
            }
            if inc.status == .in_progress {
                Button {
                    let now = ISO8601DateFormatter().string(from: Date())
                    var next = inc; next.status = .completed; next.resolvedAtISO = now
                    stores.incidents.upsert(next)
                } label: {
                    Label("Mark as resolved", systemImage: "checkmark.circle.fill").frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
            if inc.status == .completed {
                Button {
                    var next = inc; next.status = .in_progress
                    stores.incidents.upsert(next)
                } label: {
                    Label("Re-open", systemImage: "arrow.uturn.backward").frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
            }
        }
    }
}
