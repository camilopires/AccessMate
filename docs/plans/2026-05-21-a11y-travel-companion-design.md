# Accessibility Travel Companion — Design

**Date**: 2026-05-21
**Status**: Approved for implementation planning
**Owner**: Camilo Pires
**Working name**: Accessibility Travel Companion (final name TBD)

---

## 1. Overview

A cross-platform travel companion app for disabled travellers in the **UK**, covering three reinforcing pillars in v1:

1. **Directory** — curated, one-tap access to UK transport operators' accessibility lines, booking forms, and complaint routes.
2. **Accessibility Passport** — a structured profile (chair specs, communication needs, sensory needs, meds, equipment, emergency contacts) the user can show staff or feed into bookings/complaints.
3. **Complaint helper** — in-the-moment incident capture (photos, voice notes, GPS, timestamps) → hybrid template + AI draft → routed to the correct body (operator → ORR / CAA / EHRC).

A v1 **Share composer** lets users post redacted incidents to their own social accounts (X/Bluesky/Threads/Instagram), supporting the disability community's tradition of amplifying voices without us hosting a moderated feed.

---

## 2. Goals and non-goals

**Goals**
- Useful at every stage of travel (before / during / after).
- Works offline for everything except AI polish and outbound sharing.
- App is itself a model of accessibility (WCAG 2.2 AA; tested with VoiceOver, TalkBack, NVDA).
- Privacy-respecting by default: local-first storage, on-device AI preferred, opt-in sync.

**Non-goals (v1)**
- Bookings / journey planning (deep-link to operators instead).
- In-app social feed (use share-out only; revisit in v2).
- Multi-country coverage (UK only; localisation deferred).
- Companion/carer accounts (single-user device model; revisit in v2).
- Multi-language UI (English only at launch).

---

## 3. Decisions log

| # | Decision | Choice |
|---|---|---|
| 1 | Platform | Expo (React Native + RN Web) — iOS, Android, Web from one codebase |
| 2 | Primary user | All disabilities (mobility, vision, hearing, cognitive) |
| 3 | Geography | UK only for v1 |
| 4 | Wedge feature | All three pillars in v1 (Directory + Passport + Complaints) |
| 5 | Data model | Local-first with optional user-controlled cloud sync |
| 6 | Complaint engine | Hybrid: template skeleton + AI polish, with template-only offline fallback |
| 7 | Evidence capture | Full in-app capture (photos, voice notes, GPS, timestamps) |
| 8 | Implementation approach | A — Companion-first (broad, thin, all three pillars in v1) |
| 9 | AI strategy | Apple Foundation Models (iOS) + Gemini Nano via AICore (Android) + cloud Claude fallback. No bundled local models in v1. |
| 10 | Social feature | Share-out only (compose → user posts to own social account). No in-app feed. |

---

## 4. Architecture

### Client
- **Expo SDK 50+, TypeScript**. iOS, Android, and Web via React Native Web.
- **UI library**: Tamagui or Gluestack (final choice during implementation). Both have solid a11y primitives.
- **Navigation**: Expo Router (file-based, works on web).

### Local storage
- **expo-sqlite** for structured data: profile, trips, incidents, complaints, share posts.
- **expo-file-system** for media (photos, audio). Files referenced by path from SQLite rows.
- All writes transactional. Incident rows are created **before** capture begins, so a crash mid-incident still leaves a recoverable draft.

### Content distribution (directory + complaint templates)
- Bundled as **versioned JSON** inside the app.
- Updated via **Expo Updates (OTA)** — fix a wrong phone number or template within hours, no App Store review.
- Every OTA bundle has a schema version; client refuses to apply a bundle that fails schema validation. Rollback to previous bundle from Settings.

### Sync (optional, user-initiated)
- User exports an **AES-256-encrypted zip** (SQLite dump + media) to iCloud Drive / Google Drive / file download via the OS document picker.
- Passphrase set by user, never stored or transmitted.
- Import is atomic: validate → restore → confirm. No partial restore.
- No custom backend, no accounts.

### AI strategy (adapter pattern)

Single internal API: `aiPolish(scenarioTemplate, userText, profileExcerpt) → polishedNarrative`.

The adapter tries providers in order, falling through silently on unavailability:

```
1. Apple Foundation Models      — iOS-capable devices (A17 Pro+, M-series)
2. Gemini Nano via AICore       — Android 14+ capable devices (Pixel 9+, S24+)
3. Cloudflare Worker → Claude   — any networked device (Haiku 4.5 default)
4. Template-only                — offline / no provider available
```

The UI surfaces which provider was used as a small chip on the polished output ("Polished on-device" / "Polished via cloud" / "Template only").

The cloud proxy (Cloudflare Worker):
- Receives only the narrative-relevant fields, never the full profile.
- Performs PII redaction (named third parties masked) before forwarding to Claude.
- Logs nothing beyond anonymous rate-limit counters.
- Output is structurally constrained — AI only fills a narrowly-scoped narrative region; legal citations are template, not AI-editable.

### AI safety / output validation
- Prompt forbids new legal citations beyond those in the scenario template.
- Output is regex-scanned for `Section \d+|Regulation \d+|Article \d+` patterns outside the allowed set; mismatches cause the polish to be rejected and the template-only output served with a notice.
- "What gets sent" preview is mandatory before any outbound AI call — the user sees exactly what will leave the device.

### App accessibility (non-negotiable)
- WCAG 2.2 AA target.
- VoiceOver / TalkBack / NVDA tested as a release gate.
- OS Dynamic Type honoured; UI tested at 200% font scale.
- High-contrast theme; no colour-only signalling.
- All interactive elements ≥44pt touch target.
- Keyboard navigation complete on web.
- Captions on any video.

### Legal / compliance flags
- **UK GDPR Article 9** — health/disability is special-category data. Profile stays on device by default; sync is user-encrypted; no third-party storage of profile content.
- **Audio recording of staff** — lawful as participant in UK, but redistribution restricted. First-use explainer; audio never auto-leaves the device; only transcripts are ever sent for polish.
- **"Legal advice" boundary** — disclaimer on every drafted complaint; signpost to Disability Law Service / Citizens Advice for actual legal help.

---

## 5. Components

Ten top-level surfaces. Each does one job well.

| # | Screen | Job |
|---|---|---|
| 1 | **Onboarding** | 5-question skip-friendly wizard for an initial profile. Everything is editable later. |
| 2 | **Home ("What now?")** | Three big-tap actions: Plan a trip · I'm traveling now · Something went wrong. One-handed, screen-reader-sweepable. |
| 3 | **My Accessibility Passport** | Chair specs (dimensions, weight, battery type per IATA), communication needs (BSL, AAC, Easy Read), sensory needs, meds, equipment, emergency contacts, blue badge, free-text notes. Exportable as printable PDF. |
| 4 | **Directory** | Searchable UK operators grouped by mode (Rail · Air · Bus/Coach · Taxi/PHV · TfL/Local). Entries show assistance phone (one-tap call), accessibility page, assistance booking link, complaint route. "Open now" filter. |
| 5 | **Trips** | Lightweight itinerary (London → Manchester, 14:30, Avanti). No booking. Provides context for auto-tagging incidents. Optional. |
| 6 | **Incident capture** | "Something went wrong" → instant Incident row with timestamp + GPS + inferred operator. Add photos, voice notes, free-text. Designed to be usable while stressed. |
| 7 | **Complaint composer** | Incident + scenario template + profile → draft. AI polish via adapter chain. "What gets sent" preview. Output: mailto, copy, PDF export, or Share composer. |
| 8 | **Complaint tracker** | Filed complaints with manual status (Sent → Acknowledged → Resolved → Escalated). 8-week reminder before escalation to regulator. Stores response when received. |
| 9 | **Share composer** | Redact (staff names masked by default), pick platform (X/Bluesky/Threads/IG), preview, copy. Nothing hosted by us. |
| 10 | **Settings** | Sync (export/import bundle), AI provider toggle, accessibility options, data export, wipe device data, about/legal/disclaimer. |

### Reusable building blocks
- `BigActionButton` — full-width, ≥56pt, icon + label.
- `ProfileChip` — one profile field with edit affordance.
- `OperatorCard` — directory entry with one-tap actions.
- `EvidenceItem` — photo/audio/text bubble with timestamp.
- `ProviderChip` — small label indicating which AI provider produced an output.

### Intentionally NOT in v1 (YAGNI)
Booking integrations · real-time journey planning · in-app social feed · multi-language UI · companion/carer mode · user-generated directory entries · in-app payments.

---

## 6. Data flow

### A. Directory lookup — 0 network calls
```
Home → Directory → search/filter → operator → one-tap call/email/web
```
Bundled JSON. Works with no signal.

### B. Show passport — 0 network calls
```
Home → Passport → "Show as passport" → printable summary (large type, high contrast)
```
Local SQLite read.

### C. Incident capture — 0 network calls
```
Home → "Something went wrong"
  → SQLite: create Incident row (id, timestampUTC, gps if granted)
  → infer operator from active Trip; else ask once
  → user adds photos / voice / text
  → "Save" → Home with toast: "Incident saved as draft"
```
Audio transcribed on-device where possible (iOS speech, Android speech); else later.

### D. Compose & file complaint
```
Complaints → open Incident draft → "Compose complaint"
  → pick scenario (Missed Passenger Assist, Damaged equipment, Refused boarding,
    Inaccessible facility, Discriminatory treatment, …)
  → app assembles:
       Header (operator + correct complaint address)
       Facts (auto-filled from Incident: when, where, train/flight, evidence list)
       Profile context (auto-filled from relevant Passport fields)
       Legal/rights paragraph (template, cites Equality Act 2010 / EU 1107/2006 / Passenger Assist)
       Narrative (PLACEHOLDER — needs polish)
       Ask (refund/apology/policy change, per scenario)
  → "What gets sent for polish" preview
  → aiPolish() adapter chain (Apple FM → Gemini Nano → cloud → template)
  → user edits → output: mailto / copy / PDF / Share composer
  → mark as Sent → enters tracker
  → 8-week local notification: "Time to escalate to ORR / CAA / EHRC?"
```

### Data shapes (sketch)
```ts
Profile  { id, version, chair?: ChairSpec, comms: CommNeed[], sensory: SensoryNeed[],
           meds: Med[], equipment: Equipment[], emergencyContacts: Contact[], notes }
Trip     { id, operatorId, modeId, origin, destination, departUTC, reference, notes }
Incident { id, createdUTC, gps?, tripId?, operatorId, descriptionText,
           media: MediaRef[], status: 'draft' | 'attached' }
Complaint{ id, incidentId, operatorId, scenarioTemplateId, draftMarkdown,
           polishProvider: 'apple-fm' | 'gemini-nano' | 'cloud' | 'template-only',
           status: 'draft' | 'sent' | 'acknowledged' | 'resolved' | 'escalated',
           sentAt?, acknowledgedAt?, responseText?, escalationTarget? }
MediaRef { id, path, kind: 'photo' | 'audio' | 'doc', capturedUTC, sizeBytes }
SharePost{ id, sourceIncidentId | sourceComplaintId, platform, redactedText, imagePath? }
```

---

## 7. Error handling

**Principle**: every feature degrades to *something useful*. Errors are spoken in plain English with a concrete next action.

| Failure | Mitigation |
|---|---|
| No network | Directory, Passport, Incident, template-only complaints all work offline. AI polish and Share are clearly network-only. |
| On-device AI unavailable | Adapter silently falls through. UI shows which provider was used. |
| Cloud proxy unreachable | Falls to template-only. Banner: "AI polish unavailable — edit and send the template." |
| AI returns unsafe output | Structural constraints reject it; template-only served with notice. |
| Permission denied (camera/mic/GPS) | Feature degrades. Library import instead of camera; typed/dictated instead of mic; type station name instead of GPS. Never gate the Incident flow on any one permission. |
| Storage full | Pre-check before recording. Offer lower quality or export-and-delete. Auto-compress on save. |
| Bad OTA content push | Schema validation pre-apply; one-tap rollback in Settings. |
| Sync: wrong passphrase / corrupt bundle | Validate before import; atomic restore. |
| App crash mid-incident | Transactional SQLite; relaunch offers to resume the unfinished incident. |
| Outdated operator info | "Report this is wrong" link on every Directory entry → prefilled issue/email; OTA fix within hours. |
| `mailto:` has no handler | Fall back to copy-to-clipboard / PDF + share sheet / open operator's web complaint form. |
| AI hallucinates a citation | Legal/citation block is template, not AI-editable. AI output regex-scanned; mismatches rejected. |
| Audio recording legality concerns | First-use explainer (lawful as participant; don't redistribute; stays on device). |
| VoiceOver focus lost on navigation | Expo Router with explicit focus management; SR script run every release. |
| Web without camera/mic | `getUserMedia` / `<input type=file capture>`; step down to upload affordances where unavailable. |

**Telemetry posture**: opt-in, error-only, anonymous. Default OFF. Captures error type + screen + provider chain outcome only — never PII or incident text.

---

## 8. Testing

**Unit (Vitest)**
- Template assembly given Incident + Profile + scenario.
- Redaction over a corpus of 50+ cases.
- AI output validators reject rogue citations, missing sections, out-of-scope edits.
- Sync bundle round-trip identity.
- Content OTA bundle schema validation.

**Component (React Native Testing Library)**
- Snapshot + interaction tests on every reusable component.
- Every interactive element asserts `accessibilityLabel`, `accessibilityRole`, touch target ≥44pt.
- High-contrast theme passes WCAG AA contrast (automated).

**Integration / E2E (Maestro for native, Playwright for web)**
- Golden path per flow: Directory, Passport, Incident, Complaint, Share.
- Cross-platform parity matrix: iOS 18, Android 14, modern Safari/Chrome.
- Offline-mode coverage for every flow that should work offline.

**Accessibility (release gate)**
- Automated: `eslint-plugin-jsx-a11y`, RN a11y lint, axe-core via Playwright on web.
- Manual SR scripts every release (VoiceOver, TalkBack, NVDA) — `docs/qa/a11y-scripts.md`.
- Dynamic Type / OS font scaling at 200% — no truncation or broken layout.
- Keyboard-only navigation on web — every action reachable.

**AI evaluation suite**
- Golden set: ~30 incident inputs × 10 scenarios × 2-3 difficulty levels.
- Per provider (Apple FM, Gemini Nano, cloud, template-only):
  - Structural conformance (regex / JSON schema — must pass).
  - Factual fidelity (LLM-as-judge).
  - Tone — formal, clear, non-aggressive (LLM-as-judge).
  - Readability — Flesch-Kincaid Grade 8 or lower.
- Runs in CI on every prompt change; regressions block merge.

**Privacy / leak tests**
- "What gets sent" preview asserted byte-identical against the actual outbound request body.
- Corpus of names/addresses/case numbers in incident text → assert none appear in the AI request body after redaction.

**Performance (release gate)**
- Cold start → Home <1.5s on iPhone 12 / Pixel 6.
- Tap "Something went wrong" → capture ready <500ms.
- Template-only complaint generation <100ms.

**Community user testing (the differentiator)**
- Moderated sessions with 5+ disabled testers covering chair user, BSL signer, low-vision, cognitive needs.
- Pay testers (ethical baseline).
- Recruit via Transport for All, Disability Rights UK, RNIB, RNID, Scope.
- Findings tracked as a11y-bugs with their own priority lane.

**Not testing in v1**
- Pixel-perfect visual regression (noisy).
- Load testing the Cloudflare Worker pre-traffic.
- Device-model coverage beyond reference devices (low-end iPhone, mid Android, premium Android).

---

## 9. Open questions / future work

- **App naming + brand** — working title only; needs consultation with potential users.
- **Content sourcing** — initial directory and complaint templates need legal review (Disability Rights UK / Disability Law Service partnership?).
- **OTA content governance** — who can push template changes; review process.
- **v2 candidates** — companion/carer mode, in-app social feed (with proper moderation budget), multi-language, additional countries, integration with operator APIs where they exist (e.g. Passenger Assist API if/when available), aggregate/data-led complaint trends.
- **Funding / cost model** — Cloudflare Worker + Claude API have per-call cost; on-device AI offsets most of it; pricing/sustainability needs its own brainstorm.

---

## 10. Next step

Hand off to `superpowers:writing-plans` to produce an incremental implementation plan with TDD-friendly slices.
