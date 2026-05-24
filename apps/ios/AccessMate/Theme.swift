import SwiftUI
import UIKit

/// Warm civic editorial palette — mirrors the design tokens in
/// packages/shared used by the web app and Android app.
enum Theme {
    static let paper        = Color(red: 0.98, green: 0.97, blue: 0.95)
    static let raised       = Color(red: 0.99, green: 0.98, blue: 0.96)
    static let sunken       = Color(red: 0.95, green: 0.93, blue: 0.89)
    static let ink          = Color(red: 0.105, green: 0.10, blue: 0.09)
    static let inkMuted     = Color(red: 0.435, green: 0.415, blue: 0.376)
    static let inkSoft      = Color(red: 0.604, green: 0.580, blue: 0.521)
    static let accentBase   = Color(red: 0.722, green: 0.361, blue: 0.122)
    static let accentDeep   = Color(red: 0.478, green: 0.227, blue: 0.059)
    static let hairline     = Color(red: 0.902, green: 0.874, blue: 0.820)
    static let emergency    = Color(red: 0.710, green: 0.216, blue: 0.157)
}

/// Glass tint variants. iOS 26+ swaps these out for SwiftUI's native
/// `.glassEffect()` modifier; older iOS falls back to a tinted paper
/// surface.
enum GlassKind {
    case card    // section card on a scroll surface
    case sheet   // root surface of a modal
    case chrome  // tab bar / nav chrome
}

/// Glass-or-paper surface that uses Apple's `.glassEffect()` on iOS 26+
/// and falls back to a tinted paper card on older OS. Reduce
/// Transparency makes the fallback path active even on iOS 26.
struct CardSurface<Content: View>: View {
    let kind: GlassKind
    let radius: CGFloat
    let content: () -> Content
    init(
        kind: GlassKind = .card,
        radius: CGFloat = 16,
        @ViewBuilder _ content: @escaping () -> Content
    ) {
        self.kind = kind
        self.radius = radius
        self.content = content
    }
    var body: some View {
        Group {
            if #available(iOS 26.0, *), !UIAccessibility.isReduceTransparencyEnabled {
                content()
                    .padding(16)
                    .glassEffect(.regular, in: .rect(cornerRadius: radius))
            } else {
                content()
                    .padding(16)
                    .background(fallbackBackground)
                    .overlay(
                        RoundedRectangle(cornerRadius: radius)
                            .stroke(Theme.hairline, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: radius))
            }
        }
    }
    private var fallbackBackground: Color {
        switch kind {
        case .card:   return Theme.raised
        case .sheet:  return Theme.paper
        case .chrome: return Theme.paper
        }
    }
}

struct SectionLabel: View {
    let text: String
    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 12, weight: .semibold, design: .default))
            .tracking(1.4)
            .foregroundStyle(Theme.inkMuted)
    }
}

struct StatusBadge: View {
    let status: String
    var body: some View {
        let (bg, fg, label) = palette(for: status)
        Text(label.uppercased())
            .font(.system(size: 11, weight: .bold))
            .tracking(0.6)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(bg, in: Capsule())
            .foregroundStyle(fg)
    }
    private func palette(for status: String) -> (Color, Color, String) {
        switch status {
        case "draft":       return (Theme.sunken, Theme.inkMuted, "Draft")
        case "in_progress": return (Theme.accentDeep, .white, "In progress")
        case "completed":   return (Color(red: 0.18, green: 0.42, blue: 0.23), .white, "Completed")
        default:            return (Theme.sunken, Theme.inkMuted, status)
        }
    }
}
