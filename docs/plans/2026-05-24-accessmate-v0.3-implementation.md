# AccessMate v0.3 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. TDD where the contract is testable (TS / RN screens). Native Swift changes get manual sim verification at the end.

**Goal:** Land the four pillars approved in `2026-05-24-accessmate-v0.3-design.md` and tag v0.3.0.

**Architecture:** See design doc.

**Tech Stack:** Expo SDK 54, RN 0.81, expo-router 6, Zod 4, SwiftUI iOS 26 (`.glassEffect`), Apple FoundationModels (`LanguageModelSession` + `@Generable`).

---

## Batches

- **Batch A — Glass (real, via SwiftUI):** A1–A4 (module rewrite + tab bar)
- **Batch B — Glass adoption (sheets + cards):** A5–A9
- **Batch C — Conversational AI native + TS:** B1–B3
- **Batch D — Conversational AI UI:** B4–B5
- **Batch E — Onboarding fold:** C1–C5
- **Batch F — 20 operators:** D1–D3
- **Batch G — README + tag:** E1–E3

---

## Phase A — Liquid Glass (real)

### A1: Rewrite `GlassSurfaceModule.swift` to use SwiftUI `.glassEffect()`

**File:** `modules/glass-surface/ios/GlassSurfaceModule.swift`

- Replace UIKit `NSClassFromString` probing with `UIHostingController<GlassPanel>` mount.
- `GlassPanel` is a `View` that applies `.glassEffect(style, in: .rect(cornerRadius:))` on iOS 26+.
- Tint mapping: `chrome → .regular`, `card → .regular`, `sheet → .regular.tint(...)` (we let SwiftUI pick the best style; iOS 26 only ships `.regular` and `.clear`).
- Keep the Reduce Transparency notification observer; on toggle, rebuild.
- Add a `cornerRadius` prop (CGFloat, defaults to 0).

**Step 1:** Edit file.
**Step 2:** `pnpm typecheck` (Swift won't be checked by tsc — manually `cd modules/glass-surface && swift build` if available; otherwise rely on prebuild).
**Step 3:** Commit `feat(glass): rewrite native module on SwiftUI .glassEffect()`.

### A2: Add `<GlassEffectContainer>` for grouped surfaces

**File:** `modules/glass-surface/ios/GlassSurfaceModule.swift` (additional `View` registration)

- A second `View(GlassContainerUIView.self)` that hosts a SwiftUI `GlassEffectContainer { children }` — children mount through a transparent `UIView` so React Native composition still works.
- Actually: since RN can't pass children into a Swift `View` directly, simpler approach: skip the container for v0.3. The single `<GlassSurface>` rounded blocks merge well enough at our densities.
- **Decision:** drop GlassContainer for v0.3 (YAGNI). Revisit if visual stacking looks muddy on device.

**Outcome:** A2 is a no-op. Note in commit body.

### A3: Update `src/components/GlassSurface.tsx`

**File:** `src/components/GlassSurface.tsx`

- Add `cornerRadius?: number` prop; default 12 for `card`, 0 for `chrome`, 24 for `sheet`.
- Pass to native via `cornerRadius` prop.
- Keep paper fallback unchanged.

**Step:** Edit + commit `feat(glass): cornerRadius prop on GlassSurface`.

### A4: Adopt glass in the tab bar

**File:** `app/(tabs)/_layout.tsx`

- Add `tabBarBackground: () => <GlassSurface tint="chrome" style={{ flex: 1 }} />` to `screenOptions`.
- Set `tabBarStyle.backgroundColor: 'transparent'`.
- Keep current high-contrast active/inactive tint colors.

**Verify:** vitest stays green, jest stays green, web e2e still passes (web sees paper fallback).
**Commit:** `feat(glass): tab bar uses GlassSurface chrome on iOS`.

### A5: Adopt glass on Report modal sheet root

**File:** `app/report.tsx`

- Wrap the screen content in `<GlassSurface tint="sheet" cornerRadius={24} style={{ flex: 1 }}>`.
- Make `AppShell` background `transparent` when wrapped in glass (add a `transparent` prop).

**File:** `src/components/AppShell.tsx` — add `transparent?: boolean` prop that sets canvas background to `'transparent'`.

**Commit:** `feat(glass): Report sheet root is glass on iOS`.

### A6: Section cards on Incidents tab

**File:** `src/screens/IncidentsListScreen.tsx`

- Wrap the filter chips block in `<GlassSurface tint="card" cornerRadius={16}>`.
- Wrap the EmergencyCard's outer container similarly.
- Wrap each rendered DestinationCard in glass (the card already has a paper background; switch to glass on iOS).

**Verify:** jest snapshot / RNTL tests still pass.
**Commit:** `feat(glass): Incidents tab section cards on iOS`.

### A7: Section cards on Passport tab

**File:** `src/profile/PassportView.tsx`

- Wrap each `<Section>` in `<GlassSurface tint="card" cornerRadius={16} style={{ padding: 16 }}>`.

**Commit:** `feat(glass): Passport sections on iOS`.

### A8: Section cards on Settings tab

**File:** `app/(tabs)/settings.tsx`

- Wrap each `<View style={styles.section}>` block in `<GlassSurface tint="card" cornerRadius={16}>` (keep section gap on the outside).

**Commit:** `feat(glass): Settings sections on iOS`.

### A9: Section cards on IncidentDetail

**File:** `src/screens/IncidentDetailScreen.tsx`

- Wrap timeline and action groups in glass cards.

**Commit:** `feat(glass): IncidentDetail sections on iOS`.

---

## Phase B — Conversational AI

### B1: Extend `AppleFmModule.swift` with session APIs + `@Generable` types

**File:** `modules/apple-fm/ios/AppleFmModule.swift`

- Add `@Generable struct ConversationTurn { let message: String; let isComplete: Bool; let facts: IncidentFactsPayload? }`.
- Add `@Generable struct IncidentFactsPayload { ... 8 optional fields ... }`.
- Add `private static var sessions: [String: LanguageModelSession] = [:]`.
- Add `AsyncFunction("startConversation") { (systemPrompt: String) -> String }` — returns UUID.
- Add `AsyncFunction("sendMessage") { (sessionId: String, userText: String) async throws -> [String: Any] }` — returns `{ assistantText, isComplete, facts? }`.
- Add `AsyncFunction("endConversation") { (sessionId: String) }`.
- All gated by `@available(iOS 26.0, *)` and `#if canImport(FoundationModels)`.

**Step 1:** Edit file (no Swift tests change — the testable helpers are unchanged).
**Step 2:** Commit `feat(ai): native session APIs for conversational intake`.

### B2: TS bindings in `modules/apple-fm/src/`

**File:** `modules/apple-fm/src/index.ts`

- Export typed `startConversation`, `sendMessage`, `endConversation`.
- Types: `ConversationTurn = { assistantText: string; isComplete: boolean; facts?: Partial<IncidentFacts> }`.

**Step:** Edit + `pnpm typecheck`.
**Commit:** `feat(ai): TS bindings for conversational AppleFm`.

### B3: `chooseFlow()` helper + tests

**Files:**
- Create `src/ai/conversation.ts` — exports `chooseFlow(deps) → 'conversational' | 'template'` (pure function over settings + Platform + an injected `isAppleFmAvailable: () => Promise<boolean>`).
- Create `src/ai/conversation.test.ts` — vitest covering each branch.

**TDD:**
1. Write `conversation.test.ts` with 4 cases (non-iOS → template; ai off → template; iOS + ai on + fm unavailable → template; iOS + ai on + fm available → conversational).
2. Run — fails.
3. Implement `conversation.ts`.
4. Run — passes.
5. Commit `feat(ai): chooseFlow strategy + tests`.

### B4: `ConversationalReportScreen.tsx` (TDD)

**Files:**
- Create `src/screens/ConversationalReportScreen.tsx`
- Create `src/screens/ConversationalReportScreen.test.tsx`

**Props:**
```ts
interface Props {
  operators: OperatorEntry[];
  templates: ComplaintTemplate[];
  startConversation: (sys: string) => Promise<string>;
  sendMessage: (id: string, text: string) => Promise<ConversationTurn>;
  endConversation: (id: string) => Promise<void>;
  onComplete: (draft: DraftInput) => void;
  onSwitchToForm: () => void;
}
```

**Tests (TDD, in order):**
1. Renders initial assistant message after mount → write test, fail, implement, pass.
2. Submitting user text appends a user bubble + sends to native + appends assistant reply.
3. When `isComplete=true`, calls `onComplete` with a draft built via `assembleDraft`.
4. "Switch to form" button calls `onSwitchToForm`.

**Commit per green test.**

### B5: Wire conversational vs template in `app/report.tsx`

**File:** `app/report.tsx`

- On mount, call `chooseFlow()`. While deciding, show a tiny spinner.
- If `conversational`, render `<ConversationalReportScreen>` with real `AppleFm.*` bindings.
- If `template`, render existing `<ReportForm>`.
- `onSwitchToForm` flips to template mode and preserves any captured facts (passed as initial props — `ReportForm` already takes operator/scenario/accompanied so this slot-fills naturally).

**Commit:** `feat(report): branch between conversational and template intake`.

---

## Phase C — Onboarding fold

### C1: Upgrade PassportView empty state

**File:** `src/profile/PassportView.tsx`

- Replace the bare empty branch with a larger invitation card (h2 + body + BigActionButton + caption), wrapped in GlassSurface.

**Test:** Update `PassportView.test.tsx` — empty state shows the new copy.
**Commit:** `feat(passport): rich empty state replaces onboarding wizard`.

### C2: Remove `onboardingComplete` from settings

**Files:**
- `src/settings/store.ts` — drop the field + default.
- `src/settings/local-storage-store.ts`, `src/settings/sqlite-store.ts` — drop reads/writes.
- Tests that asserted on it — delete the assertions.

**Step:** edit + `pnpm test:unit`.
**Commit:** `refactor(settings): drop onboardingComplete flag`.

### C3: `app/index.tsx` becomes unconditional redirect

**File:** `app/index.tsx`

- Replace the settings read + conditional with a single `<Redirect href="/(tabs)/incidents" />`.

**Commit:** `feat(nav): always land on Incidents tab`.

### C4: Delete `app/onboarding.tsx`

**File:** `app/onboarding.tsx`

- `git rm app/onboarding.tsx`.
- Remove from `app/_layout.tsx` Stack.

**Commit:** `chore: delete standalone onboarding route`.

### C5: Update e2e for new first-run

**File:** `e2e/web/smoke.spec.ts`

- Replace the "onboarding redirect on first run" test with "first run lands on Incidents, Passport empty state shows Set up CTA".

**Commit:** `test(e2e): first-run lands on Incidents directly`.

---

## Phase D — 20 operators

### D1: Add 19 operator JSON files

**Files:** 19 new files in `src/content/operators/`:
chiltern-railways.json, c2c.json, crosscountry.json, east-midlands-railway.json, elizabeth-line.json, great-western-railway.json, greater-anglia.json, lner.json, lumo.json, merseyrail.json, northern.json, scotrail.json, southeastern.json, south-western-railway.json, southern.json, thameslink.json, transpennine-express.json, transport-for-wales.json, west-midlands-railway.json.

Each shaped like the existing `avanti-west-coast.json`, with publicly listed accessibility / customer-relations contact info as of 2026-05-24.

**Step:** Write all 19. Commit in one go: `feat(content): 19 additional UK rail operators`.

### D2: Update loader

**File:** `src/content/operators/index.ts`

- Import all 20.
- Export as a single array.

**Test:** Existing `index.test.ts` — update to assert 20 entries parse.
**Commit:** `feat(content): load all 20 operators`.

### D3: Verification doc

**File:** Create `docs/operators-verification.md`

- One row per operator: id, name, source URL, date verified.
- Header note: addresses sourced from operator's own published accessibility / complaints pages on 2026-05-24; verify annually.

**Commit:** `docs: operator address verification log`.

---

## Phase E — README + tag

### E1: Run all suites, fix any reds

```bash
pnpm typecheck
pnpm lint
pnpm test       # vitest + jest
pkill -f "node.*expo/bin/cli" 2>/dev/null
lsof -ti :8081 | xargs -r kill -9 2>/dev/null
pnpm test:e2e
```

All green.

### E2: Update README

**File:** `README.md`

- Bump release line to v0.3.0.
- Update Report flow section: mention conversational intake on iOS 26+ with template fallback.
- Update Roadmap: tick D3, E3, F1, operators dataset; keep Android Gemini Nano, sync, audit deferred.
- Update Tech stack: glass via SwiftUI `.glassEffect()` (not UIGlassMaterialView).

**Commit:** `docs: README for v0.3.0`.

### E3: Tag + push

```bash
git tag -a v0.3.0 -m "v0.3.0 — Liquid Glass live, conversational AI intake, 20 operators, onboarding folded"
git push origin main
git push --tags
```

**Mark task 71 done.**

---

## Definition of done

See design doc. Every box ticked before tag.
