import SwiftUI

struct IncidentsScreen: View {
    @EnvironmentObject var stores: Stores
    @State private var filter: IncidentStatus = .in_progress
    @State private var presentingReport = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                Button {
                    presentingReport = true
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Start a new report")
                            .font(.system(size: 18, weight: .semibold))
                        Text("Tell AccessMate what happened — we'll guide you through it.")
                            .font(.system(size: 13))
                            .opacity(0.85)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(Theme.emergency)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .accessibilityHint("Opens the four-step report form")

                CardSurface {
                    Picker("Filter", selection: $filter) {
                        Text("Drafts (\(count(.draft)))").tag(IncidentStatus.draft)
                        Text("In progress (\(count(.in_progress)))").tag(IncidentStatus.in_progress)
                        Text("Completed (\(count(.completed)))").tag(IncidentStatus.completed)
                    }
                    .pickerStyle(.segmented)
                }

                let visible = stores.incidents.all
                    .filter { $0.status == filter }
                    .sorted { $0.startedAtISO > $1.startedAtISO }

                if visible.isEmpty {
                    Text(emptyMessage)
                        .foregroundStyle(Theme.inkMuted)
                        .padding(.horizontal, 4)
                } else {
                    CardSurface {
                        VStack(spacing: 12) {
                            ForEach(visible) { inc in
                                NavigationLink(value: inc.id) {
                                    IncidentRow(incident: inc)
                                }
                                .buttonStyle(.plain)
                                if inc.id != visible.last?.id {
                                    Divider().overlay(Theme.hairline)
                                }
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(Theme.paper)
        .navigationTitle("Incidents")
        .navigationDestination(for: String.self) { id in
            IncidentDetailScreen(incidentId: id)
        }
        .sheet(isPresented: $presentingReport) {
            NavigationStack {
                ReportScreen { newIncidentId in
                    presentingReport = false
                    // navigate to the new incident
                }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("TODAY")
                .font(.system(size: 12, weight: .semibold))
                .tracking(1.4)
                .foregroundStyle(Theme.inkMuted)
            Text("Incidents")
                .font(.system(size: 32, weight: .bold, design: .serif))
                .foregroundStyle(Theme.ink)
        }
    }

    private var emptyMessage: String {
        switch filter {
        case .draft:        return "No drafts. Tap Start a new report to begin."
        case .in_progress:  return "No incidents in progress."
        case .completed:    return "No completed incidents yet."
        case .discarded:    return ""
        }
    }

    private func count(_ status: IncidentStatus) -> Int {
        stores.incidents.all.filter { $0.status == status }.count
    }
}

struct IncidentRow: View {
    let incident: Incident
    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text(incident.title ?? "Untitled incident")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                Text(rowSubtitle)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.inkMuted)
            }
            Spacer()
            StatusBadge(status: incident.status.rawValue)
        }
        .padding(.vertical, 6)
    }
    private var rowSubtitle: String {
        var s = String(incident.startedAtISO.prefix(10))
        if let op = incident.facts?.operatorName { s += " · \(op)" }
        return s
    }
}
