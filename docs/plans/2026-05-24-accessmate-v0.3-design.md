# AccessMate v0.3 — finishing the next steps

**Date:** 2026-05-24
**Status:** Design (awaiting approval)
**Prior:** v0.2.0 — three-pillar scope cut (`2026-05-24-accessmate-scope-cut-design.md`)

---

## What changes

Four pillars, all explicitly requested by the product owner after seeing v0.2 live:

1. **Liquid Glass actually visible on iOS 26+**, via the public SwiftUI `.glassEffect()` API (`@expo/ui` style — SwiftUI hosted through `UIHostingController`), adopted across the tab bar, the Report modal sheet, and every section card on the three tabs.
2. **Conversational AI Report intake (D3)** — on iOS 26+ with AI enabled, the modal Report flow becomes a chat with the on-device model; the 4-step template form stays as the offline fallback and is always one tap away.
3. **Onboarding folded into Passport (F1)** — delete the standalone `/onboarding` route; first-run goes straight to Incidents; the Passport tab's existing empty-state becomes the invitation to set up the profile.
4. **Real operator dataset** — 20 of the largest UK rail operators with currently-published accessibility / customer-relations contact details, replacing the single Avanti seed.

Out of scope (deferred again, with reasons):

- **Android Gemini Nano** adapter — the `MLKit GenAI` / `AICore` public APIs are still rolling out unevenly across OEM builds; not stable enough to ship a real fallback yet.
- **Encrypted cross-device sync** — requires a backend, a key model, and a privacy review; this is a separate v0.4 initiative.
- **Phase 12 audit + community testing + store accounts** — these are process tracks, not code.

---

## Pillar 1 — Liquid Glass via Expo UI (SwiftUI)

### Why the existing scaffold doesn't render anything

`modules/glass-surface/ios/GlassSurfaceModule.swift` probes `NSClassFromString("UIGlassMaterialView")` (a UIKit class name that only existed in early iOS 26 betas) and currently always falls through to the opaque fallback. Even on a successful probe, nothing in the app actually mounts `<GlassSurface>` — `src/components/GlassSurface.tsx` is unused. So at v0.2.0 there is no glass visible by design.

### The new approach

Use **SwiftUI's public `.glassEffect(...)` modifier** (iOS 26+), hosted through `UIHostingController` — which is exactly the mechanism `@expo/ui/swift-ui`'s `Host` component uses. `@expo/ui` itself doesn't ship a `glassEffect` primitive (verified against v54 docs), but the hosting pattern is identical. We keep a local module because:

- `@expo/ui` is in alpha (docs explicitly say "Use TypeScript types to explore the API")
- We need a tiny SwiftUI view per tint, not a generic Host
- The `GlassEffectContainer` grouping (Apple's recommended way to avoid muddy stacking) needs to live in Swift

Rewrite `modules/glass-surface/`:

```swift
import SwiftUI
import ExpoModulesCore

struct GlassPanel: View {
  let tint: String              // "chrome" | "card" | "sheet"
  let cornerRadius: CGFloat
  var body: some View {
    Rectangle()
      .fill(.clear)
      .glassEffect(style(for: tint), in: .rect(cornerRadius: cornerRadius))
  }
  private func style(for tint: String) -> GlassEffectStyle {
    switch tint {
    case "chrome": return .regular         // tab bar / nav
    case "sheet":  return .thick           // modal sheet
    default:       return .regular         // card
    }
  }
}

public class GlassSurfaceUIView: ExpoView {
  private var host: UIHostingController<GlassPanel>?
  func setTint(_ tint: String, cornerRadius: CGFloat) {
    if #available(iOS 26.0, *), !UIAccessibility.isReduceTransparencyEnabled {
      let panel = GlassPanel(tint: tint, cornerRadius: cornerRadius)
      // mount UIHostingController, pin edges
    } else {
      // tinted opaque UIView (unchanged fallback)
    }
  }
}
```

`GlassEffectContainer` (Apple's API for grouping multiple glass surfaces so they merge correctly) is exposed as a second view type, `<GlassContainer>`, used to wrap the section-card group on each tab.

### Where glass lands (per the user's "tab bar + sheets + every section card" choice)

- **Tab bar background** — `(tabs)/_layout.tsx` passes `tabBarBackground: () => <GlassSurface tint="chrome" />` and sets `tabBarStyle.backgroundColor: 'transparent'`. Active/inactive tint colors stay on the high-contrast palette so WCAG AA holds against the live blur.
- **Report modal sheet** — wrap the modal content root in `<GlassSurface tint="sheet">`. The presentation stays `'modal'` (already configured in `app/_layout.tsx`).
- **Section cards** — every `SectionLabel`-grouped block in **Incidents**, **Passport**, **Settings**, **IncidentDetail** is wrapped in `<GlassSurface tint="card" cornerRadius={16}>`. To avoid muddy stacking, the per-tab scroll content is wrapped in a single `<GlassContainer>` so adjacent cards merge instead of double-blurring.

### What stays paper

- The **root canvas** (`AppShell` background) stays warm cream paper. Glass works against a non-uniform background; flooding the canvas with a dark tone (the earlier "full dark glass" direction) would break the warm civic identity and force every screen into a re-skin.
- **Android and web** — no glass primitive in `@expo/ui/jetpack-compose` or RN-Web. The paper fallback path in `GlassSurface.tsx` is untouched and remains the experience on those platforms.

### Reduce Transparency

The native module already listens for `reduceTransparencyStatusDidChangeNotification`. We keep that, and when triggered we swap to the opaque fallback at the same `tint`. Test by toggling Settings → Accessibility → Display & Text Size → Reduce Transparency.

---

## Pillar 2 — Conversational AI Report intake (D3)

### Decision criteria at mount

```ts
async function chooseFlow(): Promise<'conversational' | 'template'> {
  if (Platform.OS !== 'ios') return 'template';
  if (settings.aiProvider === 'off') return 'template';
  if (!(await AppleFm.isAvailable())) return 'template';
  return 'conversational';
}
```

There's a persistent **"Use the form instead"** affordance in the conversational view so the user can bail to the structured form at any point and keep what's been captured so far.

### Native session API

Extend `modules/apple-fm/` with three new `AsyncFunction`s — sessions are kept alive in Swift across turns so the model retains context:

```swift
private static var sessions: [String: LanguageModelSession] = [:]

AsyncFunction("startConversation") { (systemPrompt: String) -> String in
  let id = UUID().uuidString
  let session = LanguageModelSession(model: .default, instructions: systemPrompt)
  Self.sessions[id] = session
  return id
}

AsyncFunction("sendMessage") { (sessionId: String, userText: String) async throws -> [String: Any] in
  guard let session = Self.sessions[sessionId] else { throw AppleFmError.unsupportedOS }
  let response = try await session.respond(
    generating: ConversationTurn.self,
    to: userText
  )
  return [
    "assistantText": response.content.message,
    "isComplete": response.content.isComplete,
    "facts": response.content.factsAsDictionary ?? NSNull(),
  ]
}

AsyncFunction("endConversation") { (sessionId: String) in
  Self.sessions.removeValue(forKey: sessionId)
}
```

`ConversationTurn` is a `@Generable` struct so the model returns structured output, not free-form prose we'd have to parse:

```swift
@Generable
struct ConversationTurn {
  let message: String              // what the assistant says to the user
  let isComplete: Bool             // true when all required facts are gathered
  let facts: IncidentFactsPayload? // captured so far (nullable)
}

@Generable
struct IncidentFactsPayload {
  let whenISO: String?
  let operatorName: String?
  let scenarioId: String?
  let narrative: String?
  let accompanied: Bool?
  let staffInteractions: String?
  let witnesses: String?
  let waitedMinutes: Int?
}
```

### System prompt (the instructions to the model)

```
You are AccessMate's incident-report assistant. Your job is to gather the facts
needed to file an accessibility complaint with a UK rail operator. Ask ONE
question at a time, in plain English. Keep questions under 15 words. Required:
when it happened, which operator, what the scenario was (Missed Passenger
Assist / Step-free route blocked / Assistance booked but no-show / Other),
and whether the user was alone. Optional but useful: staff interactions,
witnesses, how long they waited. Stop and set isComplete=true the moment you
have all four required fields — do not chit-chat. Do not give legal advice. Do
not promise outcomes.
```

### UI — `src/screens/ConversationalReportScreen.tsx`

A standard chat layout:
- VirtualList of messages, AI on left, user on right (StackView style, no avatars)
- Single multiline `TextInput` pinned to bottom
- "Send" button (BigActionButton, 56pt)
- Header link: **"Switch to the form"** — opens the template form pre-filled with any facts captured so far
- A small `…thinking` row while the native call is in flight
- When `isComplete=true`, hand off to `assembleDraft(facts, operators, templates)` and navigate to the same incident detail screen the template path uses

### Tests

- **Vitest:** a fake `AppleFm` that returns canned `{assistantText, isComplete, facts}` payloads; assert the screen feeds user input back and routes onComplete.
- **Jest-RNTL:** ConversationalReportScreen renders a streamed conversation, accepts text, calls onComplete with a fully-formed draft.
- **Native Swift:** unit-test the `@Generable` parsing path with a stub session (compile-only, since the actual FM call can't run in unit tests).

---

## Pillar 3 — Onboarding folded into Passport (F1)

### What goes away

- **Delete** `app/onboarding.tsx`
- **Delete** the `onboardingComplete` field on `Settings` (and any reads)
- **Delete** the onboarding branch in `app/index.tsx` — it becomes an unconditional `<Redirect href="/(tabs)/incidents" />`
- **Delete** the "Set up later" / "Skip onboarding entirely" affordances (no longer reachable)

### What replaces it

`PassportView` already has an empty-state branch (line 52). We upgrade it from a one-liner to a real invitation card:

```tsx
<GlassSurface tint="card" cornerRadius={16}>
  <View style={{ padding: 24, gap: 16 }}>
    <Text style={type.h2}>Set up your passport</Text>
    <Text style={type.body}>
      Staff can see your access needs at a glance. Takes about 90 seconds and
      stays on your device.
    </Text>
    <BigActionButton label="Set up passport" hint="Start a 4-step setup" onPress={onEdit} />
    <Text style={type.caption}>You can skip anything and come back later.</Text>
  </View>
</GlassSurface>
```

The 5-step onboarding wizard becomes the **profile editor** (`/profile/edit`) — which already exists. No double maintenance.

---

## Pillar 4 — Real operator dataset (~20)

### Selection

The 20 largest UK rail operators by 2024–25 passenger volume, dropping joint-venture duplicates (GTR is one ATOC code but three brands — we list each brand because complaints route differently):

1. Avanti West Coast *(already present)*
2. Chiltern Railways
3. c2c
4. CrossCountry
5. East Midlands Railway
6. Elizabeth line *(TfL — included because most users won't distinguish it from National Rail)*
7. Great Western Railway
8. Greater Anglia
9. Heathrow Express
10. Hull Trains
11. LNER (London North Eastern Railway)
12. Lumo
13. Merseyrail
14. Northern
15. ScotRail
16. Southeastern
17. South Western Railway
18. Southern *(GTR)*
19. Thameslink *(GTR)*
20. TransPennine Express
21. Transport for Wales
22. West Midlands Railway

That's 22 — we'll trim to 20 by collapsing Heathrow Express (private, niche) and Hull Trains (open-access, niche) if needed. Decision deferred to the data subtask.

### Per-operator file shape

Same `OperatorEntry` schema as the existing `avanti-west-coast.json`:

```json
{
  "id": "northern",
  "name": "Northern",
  "mode": "rail",
  "assistance": {
    "phone": "+44-800-138-5560",
    "bookingUrl": "https://www.northernrailway.co.uk/travel/accessibility/passenger-assist",
    "accessibilityPageUrl": "https://www.northernrailway.co.uk/travel/accessibility"
  },
  "complaintsRoute": {
    "primaryEmail": "customer.experience@northernrailway.co.uk",
    "regulator": "orr"
  },
  "lastVerifiedUTC": "2026-05-24T00:00:00Z"
}
```

Each file gets a small comment-line in the loader noting the source page so the next person to verify knows where to look.

### Verification posture

Addresses are sourced from each operator's own published accessibility / customer-relations page on 2026-05-24. The `lastVerifiedUTC` field exists precisely so the dataset can be audited annually. A `docs/operators-verification.md` note documents the source URL for each entry.

The product owner has accepted that data accuracy is their responsibility to verify before public release.

---

## Architecture summary

```
ios surface:
  AppShell (paper canvas)
    GlassContainer (per tab)
      GlassSurface tint="card"  ← every section block
    Tabs.Screen options.tabBarBackground = <GlassSurface tint="chrome" />
    Modal sheet root = <GlassSurface tint="sheet">

report flow:
  app/report.tsx
    chooseFlow()
      → conversational  → ConversationalReportScreen → AppleFm.{start,send,end}Conversation → assembleDraft
      → template        → ReportForm                  → assembleDraft
    onComplete → store.saveDraft → router.replace('/incidents/[id]')

onboarding:
  app/index.tsx → unconditional Redirect → /(tabs)/incidents
  PassportView empty state → opens /profile/edit

data:
  src/content/operators/*.json × 20
  loadBundledOperators() returns the full array
```

---

## Open questions for the product owner

None — scope was locked via `AskUserQuestion` before this doc was written. If anything in the four pillars above is not what you meant, flag it before I write the implementation plan.

---

## Definition of done

- iOS Simulator (Xcode 16, iOS 26 SDK): glass visible on tab bar, modal sheet, and section cards on all three tabs; Reduce Transparency toggle swaps to fallback live
- Report flow on iOS 26 + AI enabled: chat completes a 4-required-field intake in ≤ 6 turns and lands on the same incident detail page as the template form
- First-run on a fresh install: tab bar visible immediately, Passport tab shows the empty-state card, tapping it opens `/profile/edit`
- Operator picker shows 20 entries; each entry's draft assembly puts the correct primary email in the recipient field
- `pnpm typecheck` clean, `pnpm lint` clean, `pnpm test` green, `pnpm test:e2e` green
- README updated to mention conversational intake, real operator dataset, and glass adoption
- Tag `v0.3.0`, push origin main + tags
