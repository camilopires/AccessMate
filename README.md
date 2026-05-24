# AccessMate

**An accessibility-first travel companion for the UK rail network.**

AccessMate helps disabled passengers carry their access needs from one journey to the next, capture what went wrong when something fails, and turn that capture into a complaint that the operator (and, if needed, the regulator) will actually act on. Everything lives on the device — there is no account, no cloud, no analytics.

Current release: **v0.3.0** — Liquid Glass live on iOS, conversational AI Report intake, onboarding folded into Passport, 20 real UK rail operators.

---

## The three pillars

The app is deliberately small. One tab per pillar, in this order:

### 1. Incidents — the default tab

A single list of every report you've ever started, with three filter chips:

- **Drafts** — captured but not sent
- **In progress** — sent to the operator, awaiting response or escalated
- **Completed** — operator responded and you marked it resolved, or you closed it

At the top of the list sits a **Start a new report** call-to-action. Each row shows the operator, the date, and a status badge.

Tap any incident to see its **timeline** — capture → sent → operator response → escalation → resolved — and the actions available at that step (Edit / Send / Discard for drafts; Operator replied / Escalate to regulator / Mark resolved for in-progress; Export PDF / Re-open for completed).

### 2. Passport — your accessibility profile

A one-screen summary of the access needs you want staff to know about: mobility aid, sight, hearing, cognitive, hidden disabilities, preferred boarding side, whether you travel with an assistance dog or a companion. The Passport is the source of truth that the Report flow auto-fills from, and it can be shown to staff as a single card.

### 3. Settings

Accessibility preferences (high contrast, reduce motion, font scale), AI provider (`off` / `on-device` / `on-device + cloud`), and data controls (export everything as JSON, wipe device data).

---

## The Report flow

When you tap **Start a new report**, a modal sheet opens. On iOS 26+ with on-device AI enabled it becomes a **conversational intake** — Apple FoundationModels asks one short question at a time, captures the four required facts (when, operator, scenario, alone-or-accompanied) plus any optional context, and hands off to draft assembly. Everything else (web, Android, older iOS, AI disabled) gets the structured **4-step template form**:

1. **When did this happen?** — date defaults to today
2. **Which operator?** — pick from the 20 UK rail operators
3. **What happened?** — pick a scenario (e.g. _Missed Passenger Assist_, _Step-free route blocked_, _Assistance booked but no-show_)
4. **Were you alone?** — alone / with a companion

Both flows end the same way: a draft complaint addressed to the right recipient at that operator, pre-populated with your Passport details, the scenario template, and the captured facts. You can edit the draft, send it, or save it for later. The interaction is designed to take under 90 seconds even on a moving train, and the conversational flow has a persistent **"Switch to form"** link so you can bail out without losing what you've captured.

---

## Design language

A warm, civic, editorial aesthetic — closer to a Penguin paperback than a startup landing page.

- **Type:** Fraunces (display) + Manrope (body), via `@expo-google-fonts`
- **Palette:** cream paper `#FAF7F2`, ink `#1B1A17`, amber accent (`accent.deep #7A3A0F` for anything small enough to need WCAG AA contrast, `accent.base #B85C1F` for headings and large surfaces)
- **Liquid Glass on iOS 26+:** a SwiftUI `.glassEffect(.regular, in: .rect(cornerRadius:))` panel hosted through `UIHostingController` (same pattern as `@expo/ui`'s `Host`) lives in `modules/glass-surface/`. Adopted on the **tab bar**, the **Report modal sheet**, and **every section card** across the three tabs and the Incident detail screen. Reduce Transparency swaps to a tinted opaque fallback live. Web and Android render the warm paper surface.
- **Targets:** 56pt minimum touch targets everywhere (`BigActionButton`), full VoiceOver / TalkBack labels and hints, reduce-motion honored

All colors used at body or caption size meet WCAG 2.2 AA, verified in CI by axe-core.

---

## Tech stack

| Layer          | Choice                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Runtime        | **Expo SDK 54** (React Native 0.81, React 19, new architecture on)                                                               |
| Routing        | **expo-router 6** with typed routes and route groups                                                                             |
| State          | Local — no Redux, no remote state                                                                                                |
| Persistence    | **SQLite** on native (`expo-sqlite`), `localStorage` on web — selected via a platform-aware store factory                        |
| Schemas        | **Zod 4** discriminated unions for `IncidentEvent`, `IncidentFacts`, etc.                                                        |
| iOS AI         | **Apple FoundationModels** (`SystemLanguageModel` / `LanguageModelSession`, iOS 26.0+) via local Expo module `modules/apple-fm/` |
| iOS chrome     | **SwiftUI `.glassEffect(...)`** (iOS 26.0+) hosted via `UIHostingController` in local Expo module `modules/glass-surface/`       |
| Notifications  | `expo-notifications` for follow-up reminders on stalled incidents                                                                |
| Export / share | `expo-print` (PDF), `expo-sharing`, `expo-clipboard`                                                                             |
| Web target     | `react-native-web` 0.21, static export                                                                                           |
| Tests          | **vitest** (unit), **jest + @testing-library/react-native** (component), **Playwright + @axe-core/playwright** (e2e + a11y)      |

---

## Repo layout

```
app/                       expo-router file tree
  (tabs)/                  route group: bottom-tab IA (no URL segment)
    incidents.tsx          tab 1 (default)
    passport.tsx           tab 2
    settings.tsx           tab 3
  incidents/[id].tsx       incident detail (push route)
  report.tsx               modal Report flow (conversational on iOS+AI, template otherwise)
  profile/edit.tsx         passport editor
  index.tsx                redirect to /(tabs)/incidents
  _layout.tsx              root Stack

src/
  screens/                 pure presentational screens (props in, JSX out)
  components/              AppShell, AppHeader, BigActionButton, ProfileChip, …
  incidents/               schemas, store (sqlite + localStorage), templates, assemble engine, reminders, status badge
  profile/                 passport schema + store
  settings/                settings schema + store + data-ops (export / wipe)
  content/operators/       bundled UK rail operator data
  db/                      sqlite migrations
  ai/                      strategy layer + Apple FM polish adapter
  theme/                   palette, type scale, spacing, glass tokens

modules/
  apple-fm/                Expo local native module: on-device AI on iOS 26+ (single-shot polish + multi-turn conversation)
  glass-surface/           Expo local native module: SwiftUI .glassEffect() via UIHostingController

e2e/web/                   Playwright + axe smoke suite (3-tab IA + Report flow)
tests/                     jest-RNTL setup + a few cross-cutting tests
docs/plans/                design + implementation plans (chronological)
```

---

## Getting started

```bash
pnpm install

# Web (fastest dev loop)
pnpm web

# iOS Simulator (requires Xcode 16 + iOS 26 SDK for Liquid Glass / Apple FM)
pnpm prebuild:ios
pnpm ios

# Android
pnpm prebuild
pnpm android
```

The Liquid Glass and Apple FoundationModels modules degrade gracefully on older iOS, Android, and web — you can do all of the IA, Passport, and Report work on web.

---

## Testing

```bash
pnpm typecheck      # tsc --noEmit
pnpm lint           # expo lint
pnpm test:unit      # vitest — schemas, assemble engine, stores
pnpm test:rn        # jest + @testing-library/react-native — screens, components
pnpm test:e2e       # playwright + axe-core — 3-tab IA + Report flow on web
pnpm test           # unit + rn (no e2e — that one needs a web server)
```

Counts at v0.3.0: **92 vitest + 38 jest-RNTL + 7 Playwright/axe**, all green.

---

## Privacy

- No accounts. No telemetry. No analytics SDKs. No third-party trackers.
- All data — Passport, incidents, drafts, settings — lives in SQLite on device (or `localStorage` on web).
- AI defaults to **off**. When enabled, the default is on-device only (Apple FoundationModels). Cloud is opt-in per request and never used for the Passport.
- Export gives you the full JSON. Wipe removes every byte the app wrote.

Encrypted cross-device sync is on the roadmap for a later release and will be explicitly opt-in.

---

## Roadmap

The v0.3 release closes the v0.2 deferral list. Next up (see `docs/plans/2026-05-24-accessmate-v0.3-implementation.md` for what just landed):

- **Android Gemini Nano** adapter to mirror the on-device AI story on Android (waiting on stable `MLKit GenAI` / `AICore` rollout across OEMs)
- **Encrypted cross-device sync** (opt-in; v0.4 initiative — needs a backend + a key model + a privacy review)
- **Phase 12** — independent a11y audit + community testing + store accounts (process tracks, not code)
- **Annual operator-address re-verification** — see `docs/operators-verification.md`

---

## Contributing

Read `AGENTS.md` first — it points at the **exact** Expo SDK 54 docs (`https://docs.expo.dev/versions/v54.0.0/`) that AccessMate is pinned to. The SDK changes meaningfully between minor versions and Stack Overflow answers go stale fast.

Design and implementation plans live in `docs/plans/` and are written one per topic, dated. The plan-then-execute workflow is how all non-trivial features land — please follow the same pattern.

---

## License

Not yet declared. Code is currently private to the project owner.
