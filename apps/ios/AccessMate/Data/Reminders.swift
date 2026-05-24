import Foundation
import UserNotifications

/// Schedules a follow-up reminder 8 weeks after an incident is sent.
/// Per UK rail complaint protocol, 8 weeks is the ORR-recommended
/// window after which a complainant can escalate to Rail Ombudsman if
/// the operator hasn't resolved the matter.
enum Reminders {
    static let escalateWindow: TimeInterval = 8 * 7 * 24 * 60 * 60  // 8 weeks

    /// Requests permission lazily, then schedules a notification 8
    /// weeks after the sent time. The identifier is the incident id so
    /// a subsequent cancellation (e.g. mark resolved before then) can
    /// remove the pending notification.
    static func scheduleEscalateReminder(for incidentId: String, sentAt: Date, title: String) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            let content = UNMutableNotificationContent()
            content.title = "Time to escalate?"
            content.body = "It has been 8 weeks since you sent the complaint about \"\(title)\". If you haven't had a satisfactory response, you can escalate to the Rail Ombudsman."
            content.sound = .default

            let fireDate = sentAt.addingTimeInterval(escalateWindow)
            let trigger = UNTimeIntervalNotificationTrigger(
                timeInterval: max(fireDate.timeIntervalSinceNow, 60),
                repeats: false
            )
            let request = UNNotificationRequest(
                identifier: "escalate-\(incidentId)",
                content: content,
                trigger: trigger
            )
            center.add(request)
        }
    }

    /// Cancel any pending escalate reminder for this incident.
    static func cancelEscalateReminder(for incidentId: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["escalate-\(incidentId)"]
        )
    }
}
