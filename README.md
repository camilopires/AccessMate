# AccessMate

**An accessibility-first travel companion for the UK rail network — three native apps from one shared data model.**

AccessMate helps disabled passengers carry their access needs from one journey to the next, capture what went wrong when something fails, and turn that capture into a complaint that the operator (and, if needed, the regulator) will actually act on. Everything lives on the device — no account, no cloud, no analytics.

**Current release: v0.5.0 — feature parity restored.** Bun-managed monorepo, conversational AI on iOS, Liquid Glass everywhere on iOS 26+, PDF export + push reminders on iOS / Android, parity tests pinning `assembleDraft` byte-identical across the three platforms.

---

## Repo layout

```
.
├── apps/
│   ├── web/        Vite + TypeScript + native HTML controls
│   ├── ios/        Swift + SwiftUI app, generated via XcodeGen
│   └── android/    Kotlin + Jetpack Compose + Material 3
├── packages/
│   └── shared/     Operator JSON · scenario templates · TS types + assembleDraft()
└── docs/           Design docs + operator verification log
```

Each app is independently buildable. There is no cross-app build system; the only shared artifact is `packages/shared`, which the iOS and Android apps embed at build time by copying its JSON files into their bundle.

---

## The three pillars (same on every platform)

### 1. Incidents — the default tab
Every report you've ever started, with three filter chips: **Drafts** · **In progress** · **Completed**. A prominent "Start a new report" CTA at the top.

### 2. Passport — your accessibility profile
The access needs you want staff to know about (mobility, sensory, communication, notes). Source of truth for the Report flow's "About me" section. Shown to staff as a single card.

### 3. Settings
Accessibility preferences (high contrast, reduce motion, font scale), data controls (export, wipe).

### Report flow
Pick when, which operator (from 20 UK rail operators), which scenario, alone or accompanied. The app assembles a draft complaint addressed to the right recipient, pre-populated with your Passport details and the scenario template. You can edit before sending.

---

## Building each app

### Web — `apps/web`

```bash
bun install
bun run web               # vite dev server on :5173
bun run web:build         # static export
bun run web:test          # bun:test unit suite
bun run web:e2e           # Playwright + axe smoke
```

Native HTML controls (`<button>`, `<input type="checkbox">`, `<select>`, etc.), `localStorage` persistence, no framework, ~10 KB of TypeScript.

### iOS — `apps/ios`

```bash
brew install xcodegen
cd apps/ios
xcodegen generate
open AccessMate.xcodeproj
```

iOS 17.0+ deployment target. SwiftUI throughout. On iOS 26+ the section cards adopt the public `.glassEffect(.regular, in: .rect(cornerRadius:))` modifier automatically. `UserDefaults`-backed persistence for now; SwiftData migration on the roadmap. XCTest suite for the shared `DraftBuilder` (`Cmd-U` in Xcode).

### Android — `apps/android`

```bash
cd apps/android
./gradlew :app:assembleDebug
# or: open in Android Studio Hedgehog+ and Run
```

minSdk 26 (Android 8.0), targetSdk 34, JDK 17, Kotlin 2.0, Jetpack Compose Material 3, DataStore persistence, kotlinx-serialization for JSON. JUnit unit test for the shared `DraftBuilder`.

---

## The shared data contract

`packages/shared/src/index.ts` defines the TypeScript shape used by the web app and serves as the canonical schema for the iOS / Android model classes. The `assembleDraft()` function lives in three places (TS, Swift, Kotlin) and produces identical output for identical inputs — verified by parity tests on iOS and Android.

`packages/shared/operators/*.json` (20 entries) and `packages/shared/scenarios/*.json` (10 entries) are the authoritative copies. The iOS and Android apps embed them at scaffold time:

```bash
# iOS
cp packages/shared/operators/*.json apps/ios/AccessMate/Resources/operators/
cp packages/shared/scenarios/*.json apps/ios/AccessMate/Resources/scenarios/

# Android
cp packages/shared/operators/*.json apps/android/app/src/main/assets/operators/
cp packages/shared/scenarios/*.json apps/android/app/src/main/assets/scenarios/
```

Operator address verification log: `docs/operators-verification.md`.

---

## v0.5.0 — what's new

| | | |
|---|---|---|
| **Bun-managed workspace** | replaces pnpm | scripts now `bun --filter ...`, lockfile is `bun.lock` |
| **Parity tests** | byte-identical `assembleDraft` across web / iOS / Android | one canonical JSON fixture in `packages/shared/test-fixtures/draft-cases.json`; bun:test, XCTest, JUnit all consume it |
| **Web: bun:test + Playwright/axe** | 13 unit + 5 e2e | green, WCAG 2.2 AA clean |
| **iOS: conversational AI Report intake** | iOS 26+ Apple Foundation Models | chat UI, `@Generable` capture of facts, "Use the form" hand-off preserves what's been said |
| **iOS: full Liquid Glass** | sheets + cards | `CardSurface` now exposes `card / sheet / chrome` variants; Reduce Transparency falls back live |
| **PDF export** | iOS / Android / web | `ImageRenderer → PDF` on iOS, `PdfDocument` on Android, `window.print()` with a print stylesheet on web |
| **8-week escalate reminders** | iOS + Android | `UNUserNotificationCenter` and `WorkManager` respectively; cancelled when an incident is marked resolved |

Tests at v0.5.0: **20 across the three platforms (13 web bun:test + 5 Playwright/axe + 1 iOS parity XCTest + 1 Android parity JUnit)**. iOS / Android require a local toolchain to verify (`xcodegen generate && open AccessMate.xcodeproj` and `./gradlew :app:testDebugUnitTest` respectively).

What's **not** in v0.5:

- **Web push notifications** — needs a service worker + a server endpoint to subscribe. Tracked as v0.6.
- **Apple Intelligence on iOS < 26** — Foundation Models is iOS 26.0+; older iOS gracefully falls back to the template form.
- **Conversational AI on Android** — Gemini Nano / AICore is still rolling out unevenly across OEM builds; once `MLKit GenAI` ships a stable surface the same chat UI can be added.

---

## History

- **v0.5.0 — Bun + feature parity** _(current)_. Conversational AI on iOS, full Liquid Glass, PDF export, push reminders, parity tests.
- **v0.4.0 — Monorepo cut**. Three native apps replace React Native + Expo.
- **v0.3.0 — RN final**. Liquid Glass adopted in RN, 20 operators, onboarding folded into Passport.
- **v0.2.0 — RN scope cut**. Three pillars (Incidents · Passport · Settings).
- **v0.1.0 — Initial RN prototype**.

The v0.3.0 React Native build lives under tag `v0.3.0` for reference.

---

## Why the rewrite

The v0.3 React Native build delivered Liquid Glass via a local Expo native module + the SwiftUI `.glassEffect()` modifier, but every interactive primitive (Button, Switch, Picker, etc.) was a React Native component rendered through `react-native-web`. The user pushed for true native primitives across all three targets. Rather than ship a hybrid `@expo/ui`-wrapped layer that still depends on the RN runtime, this release goes all the way: three native codebases, one shared data contract.

The cost is real — every product change now touches three implementations. The benefit is that each platform looks and feels exactly like its OS expects, with zero RN tax.

---

## Privacy

- No accounts. No telemetry. No analytics SDKs.
- Web data lives in `localStorage`. iOS data lives in `UserDefaults`. Android data lives in `DataStore`.
- Export gives you the JSON. Wipe removes every byte the app wrote on that device.

Encrypted cross-device sync is on the roadmap for a future release and will be explicitly opt-in.

---

## Contributing

If you change the shared data shape, change **all three** apps. If you add a new operator, copy the JSON into the three app bundles via the snippets above. `docs/operators-verification.md` lists the source URL for each operator and the re-verification cadence.

History from v0.1 → v0.3 (React Native) is preserved in `docs/plans/` and in git tags.
