# AccessMate v0.2 — Scope cut to three pillars

**Date:** 2026-05-24
**Status:** Approved design. Implementation plan to follow in a separate doc.
**Supersedes:** several top-level pieces of the 2026-05-21 implementation plan (Phases 1, 4, 5, 6 in particular).

## Why we're cutting

By Phase 7 the Home screen had seven destinations: Plan a trip · Your accessibility passport · Recent incidents · Complaints · Settings · I'm travelling now · Something went wrong. The product had drifted into a Swiss-army-knife shape. The user wants three pillars:

1. **Accessibility passport** — the artifact you show to staff.
2. **Report an incident** — the guided, AI-assisted flow when something goes wrong.
3. **Current incident list** — filtered by Drafts · In Progress · Completed.

Plus Settings, which the user accepted as a fourth tab — but in the final IA it sits alongside the pillars rather than competing with them.

## 1. Information architecture

Three bottom tabs:

```
Incidents (default)     Passport     Settings
```

- **Incidents** is the default landing. At the top of the screen, a single prominent CTA: **"Start a new report"** (`EmergencyCard`-style on iOS Liquid Glass canvas, paper-amber elsewhere). Below it: a segmented control `Drafts · In Progress · Completed` with row counts, then the list.
- **Passport** — the passport view + edit, with onboarding folded in as the empty state.
- **Settings** — preferences (font, contrast, AI provider) + data (export, wipe) + about.

The Home screen, Directory, Share, and the Compose/Complaints routes from the previous design are cut.

## 2. Data model

Collapse `Complaint` into `Incident`. The 5-status complaint enum (draft/sent/acknowledged/resolved/escalated) becomes a 3-status incident enum (draft/in_progress/completed). Escalation becomes a sub-event on the same incident.

```ts
export const IncidentStatus = z.enum(['draft', 'in_progress', 'completed']);

export const Incident = z.object({
  id: z.string().min(1),
  startedAtISO: z.string().datetime(),
  status: IncidentStatus,
  title: z.string().optional(),
  operatorId: z.string().optional(),
  location: Location.optional(),

  // Structured intake (filled by AI conversation or by template form)
  facts: z.object({
    whenISO: z.string().datetime().optional(),
    mode: TransportMode.optional(),
    operatorName: z.string().optional(),
    scenarioId: z.string().optional(),     // which template
    narrative: z.string().optional(),
    accompanied: z.boolean().optional(),
    staffInteractions: z.string().optional(),
    witnesses: z.string().optional(),
    waitedMinutes: z.number().optional(),
  }).optional(),

  // The outgoing letter to the operator
  draftBody: z.string().optional(),
  recipient: z.string().optional(),
  templateId: z.string().optional(),

  // Lifecycle timestamps
  sentAtISO: z.string().datetime().optional(),
  resolvedAtISO: z.string().datetime().optional(),
  reminderId: z.string().optional(),

  // Sub-events: escalation, response received, etc.
  events: z.array(IncidentEvent).default([]),
});

export const IncidentEvent = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('escalated_to_regulator'),
             atISO: z.string().datetime(),
             regulator: Regulator,
             draftBody: z.string() }),
  z.object({ kind: z.literal('operator_response'),
             atISO: z.string().datetime(),
             bodyMarkdown: z.string() }),
  z.object({ kind: z.literal('marked_resolved'),
             atISO: z.string().datetime(),
             note: z.string().optional() }),
]);
```

`MediaRef` stays as-is. The `complaints` SQLite table is dropped in migration v4; the `incidents` table gains the merged fields + an `events` JSON column.

## 3. Report flow

Single entry point: the "Start a new report" CTA on the Incidents tab, presented as a full-screen modal sheet.

### AI path (default when Apple FM is available)

Chat-style UI. AI opens with **"What happened?"** and conducts the intake one question at a time, drawing out the structured fields above. The model receives a system prompt listing what to extract (operator, scenario, narrative, staff interactions, witnesses, evidence) and is constrained to ask only for what's missing.

Two affordances throughout:
- **Draft complaint** — short-circuit; AI builds the letter from what it has.
- **Use the form instead** — switch to the template path mid-flow (loses the conversation but preserves any structured facts already extracted).

The conversation transcript is **not persisted**. We store only the structured `facts` and the resulting `draftBody`. Rationale: the conversation is scaffolding, not evidence.

### Template path (fallback when AI unavailable — Android, web, iOS < 26, Reduce Transparency users who also opt out of AI)

Same modal sheet, 4-step structured form:
1. When did this happen? (date + time)
2. Which operator / mode? (typeahead from the bundled operator list)
3. What kind of failure? (radio list of the 10 scenario templates)
4. Were you alone or accompanied? (radio)

`assembleDraft()` from the existing template engine produces the draft body. Same Send / Save / capture options after.

### After Draft

Both paths land in the same review screen:
- Editable draft body
- Attached evidence grid (photos / voice notes / typed notes — Phase 3 media capture)
- Recipient line (operator's complaints email, from the bundled directory data)
- **Send** → opens mailto, marks incident `in_progress`, schedules 8-week reminder
- **Save as draft** → stays in Drafts filter

### AI provider transparency

A small caption above the conversation makes it clear which provider is running:
- "Apple Intelligence · on-device" when `polishViaAppleFm` is hot
- "AccessMate cloud" when falling back to the Worker (user opted in via Settings)
- "Guided form" when the template path is in use

## 4. Incidents list + detail

**List screen:**
- Pinned "Start a new report" CTA at the top.
- Segmented control: `Drafts · In Progress · Completed` with row counts.
- One row per incident: title, date, operator, inline status + 8-week countdown for In Progress (`Day 3 of 56`).
- Empty state per filter ("No drafts. Tap Start a new report.").

**Detail screen:**
- Header: title, status badge, key dates.
- Timeline of sub-events (sent on X · operator replied on Y · escalated on Z).
- Evidence grid.
- Collapsed "Show outgoing letter" section with the draft body.
- Status-contextual actions:
  - **Draft** → Edit draft · Send · Discard
  - **In Progress** → Operator replied (opens paste/dictate sheet) · Escalate to regulator · Mark as resolved
  - **Completed** → Export PDF · Re-open (escape hatch)

When the user taps **Operator replied** and pastes the reply, the AI offers a one-line summary ("Operator denied responsibility — escalate?") and surfaces the Escalate button inline. Escalation generates a second `draftBody` using the regulator template, also AI-assisted if available. Sub-event recorded; incident stays In Progress until the user marks it Resolved.

## 5. Visual treatment — Liquid Glass on iOS, paper elsewhere

### iOS (26+)

A new local module `modules/glass-surface/` wraps `UIGlassMaterialView`. Surfaces that go glass:
- Tab bar
- Top safe-area / nav region
- Modal sheets (Report flow)
- Section dividers

Cards stay opaque with a glassy raised treatment (soft shadow + slight translucency over a darker scrim).

Palette nudge for iOS:
- Canvas: `#1A1D24` (cool charcoal-ink)
- Glass tint: warm white at 30% opacity
- Ink-on-glass: `#F4EFE5`
- Accent: `#FF6A4D` (vivid coral — amber-ochre reads too muddy through glass)
- Emergency: `#FF2D3A` on a frosted card with faint inner glow

Typography unchanged (Fraunces + Manrope).

**A11y guards (non-negotiable):**
- Respect `UIAccessibility.isReduceTransparencyEnabled` — fall back to opaque charcoal surfaces.
- Respect `isReduceMotionEnabled` — no animated refraction.
- All text-on-glass pairs validated against the worst-case underlying content for WCAG AA contrast.

### Android + web

Keep the warm cream + amber palette as designed in this session. No glass. `GlassSurface` component renders a paper-tinted `View` on these platforms.

## 6. What gets deleted vs kept

### Deleted entirely

| File / module | Why |
|---|---|
| `app/index.tsx` Home screen | Incidents is the new default tab |
| `app/directory/` (route + screens + tests) | Directory cut |
| `app/share.tsx` + `src/share/` | Share cut |
| `app/compose.tsx` | Folded into the Report sheet |
| `app/complaints/` routes | Folded into incident detail |
| `app/onboarding.tsx` route + redirect | Onboarding lives inside Passport empty state |

### Reshaped (kept but reworked)

| File / module | New role |
|---|---|
| `src/incidents/` (schemas, store, factories) | Expanded with merged Complaint fields + sub-event timeline |
| `src/incidents/templates/` ← `src/complaints/templates/` | Moved; templates power the form fallback and the AI's drafting step |
| `src/incidents/assemble.ts` + `outputs.ts` ← `src/complaints/*` | Moved alongside |
| `src/incidents/StatusBadge.tsx` ← `src/complaints/*` | Moved; status enum reduces 5 → 3 |
| `src/profile/`, `src/settings/`, `src/ai/` | Unchanged in shape; powers their tabs |
| `modules/apple-fm/` | Unchanged; powers the conversational intake |
| Theme tokens + AppShell + AppHeader + DestinationCard + EmergencyCard + AlertCard + ProfileChip + BigActionButton + SectionLabel | All kept |

### New

| File / module | Purpose |
|---|---|
| `app/(tabs)/_layout.tsx` + tab files | The 3-tab bar |
| `app/(tabs)/incidents.tsx` | List + segmented filter + new-report CTA |
| `app/(tabs)/passport.tsx` | Passport view + edit (existing screens, re-parented) |
| `app/(tabs)/settings.tsx` | Settings (existing screen, re-parented) |
| `app/incidents/[id].tsx` | Detail (re-parented + reshaped) |
| `app/report.tsx` (modal route) | Conversational + fallback Report flow |
| `src/incidents/ReportConversation.tsx` | Chat UI + AI loop |
| `src/incidents/ReportForm.tsx` | 4-step fallback form |
| `modules/glass-surface/` | iOS native module wrapping `UIGlassMaterialView` |
| `src/components/GlassSurface.tsx` | Cross-platform component (native on iOS, paper elsewhere) |
| `src/theme/glass.ts` | iOS-only cool-charcoal + coral palette |

### Migrations

- **`v4`**: add `events` JSON column to `incidents`, add merged Complaint fields, drop the `complaints` table.
- Data migration for any existing complaint rows (best-effort; probably empty in practice).

## Out of scope (still)

- Android Gemini Nano adapter (deferred — needs a real device)
- Encrypted cross-device sync (deferred to native)
- ~20 real operators (research task)
- Phase 12 audit + community testing + store accounts

## Risks

- **Liquid Glass implementation cost**: building the native module + maintaining two palettes is the single biggest line item.
- **AI quality on first ship**: the conversational intake's quality depends on Apple FM's instruction-following. We mitigate with the "Use the form instead" escape hatch always available.
- **Data migration**: if anyone has real `complaints` rows we need to map them onto the merged `incidents`. The migration must be safe to run on an empty table too.
- **Lost work**: Share composer + Directory had real test coverage. Deleting them removes 8+ vitest tests. That's intentional but worth acknowledging.

## Next step

Invoke `superpowers:writing-plans` to break this design into an implementation sequence.
