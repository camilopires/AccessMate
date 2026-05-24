# AccessMate v0.2 Scope-Cut Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reshape AccessMate into three pillars — Incidents (default) · Passport · Settings — collapsing the separate Complaint concept into Incident, adding a guided AI-conversational Report flow with template fallback, and treating the iOS chrome with Liquid Glass.

**Architecture:** Existing TDD-built stores (`src/incidents/`, `src/profile/`, `src/settings/`) stay; the `Complaint` store is removed and its useful fields merge into `Incident`. A new `app/(tabs)/` route group provides the three-tab bar. A new modal route `app/report.tsx` hosts both the AI-conversational intake and the structured-form fallback. A new local module `modules/glass-surface/` wraps iOS 26's `UIGlassMaterialView`. Android and web keep the warm-paper theme from this session; iOS gets a cool-charcoal + coral palette behind the glass.

**Tech Stack:** Expo SDK 54 (iOS 26 target), expo-router 6 typed routes, React 19, Zod 4, expo-sqlite (native) + localStorage (web) via the existing Platform-aware factory pattern, vitest 4 + jest-expo 55 + Playwright 1.60 + @axe-core/playwright, Apple FoundationModels (iOS 26+) via the existing `modules/apple-fm/`.

**Prerequisites (verify before starting):**
- `git pull && pnpm install`
- `pnpm test && pnpm test:e2e && pnpm lint && pnpm typecheck` — all green at the head commit of the design doc (`70b2ce0` or later).
- iOS Simulator boots via `pnpm prebuild --platform ios --clean && pnpm ios`.

---

## Phase A — Data model collapse

Goal: schema + store changes only. No UI changes yet. App still runs (the old screens reference the old Complaint store; we keep them until Phase B retires them).

### Task A1 — Migration v4: merge complaint fields into incidents

**Files:**
- Modify: `src/db/migrations.ts` (append a v4 migration)
- Create: `src/db/migrator.test.ts` already covers ordering; no new test needed for the migration itself — the schema gets exercised by Task A3's SqliteIncidentStore tests.

**Step 1 — Read the current migrations.ts to see the v1/v2/v3 patterns**

Run: `cat src/db/migrations.ts`

Confirm three existing migrations.

**Step 2 — Append v4**

Add to the `migrations` array:

```ts
{
  version: 4,
  description: 'merge complaint fields into incidents, drop complaints table',
  up: `
    ALTER TABLE incidents ADD COLUMN title TEXT;
    ALTER TABLE incidents ADD COLUMN scenario_id TEXT;
    ALTER TABLE incidents ADD COLUMN narrative TEXT;
    ALTER TABLE incidents ADD COLUMN accompanied INTEGER;
    ALTER TABLE incidents ADD COLUMN staff_interactions TEXT;
    ALTER TABLE incidents ADD COLUMN witnesses TEXT;
    ALTER TABLE incidents ADD COLUMN waited_minutes INTEGER;
    ALTER TABLE incidents ADD COLUMN template_id TEXT;
    ALTER TABLE incidents ADD COLUMN draft_body TEXT;
    ALTER TABLE incidents ADD COLUMN recipient TEXT;
    ALTER TABLE incidents ADD COLUMN sent_at TEXT;
    ALTER TABLE incidents ADD COLUMN resolved_at TEXT;
    ALTER TABLE incidents ADD COLUMN reminder_id TEXT;
    ALTER TABLE incidents ADD COLUMN events_json TEXT NOT NULL DEFAULT '[]';
    DROP TABLE IF EXISTS complaints;
  `,
},
```

Note: the old `status` column has values `'in_progress'|'completed'|'discarded'`. Discarded is staying (it's how we hide cancelled drafts from the list). The Zod enum will validate this on read.

**Step 3 — Run the existing migrator unit tests**

Run: `pnpm test:unit src/db/migrator.test.ts`
Expected: PASS (existing tests cover the runner, not the SQL contents).

**Step 4 — Commit**

```bash
git add src/db/migrations.ts
git commit -m "feat(db): migration v4 — merge complaint fields into incidents"
```

---

### Task A2 — Expand Incident Zod schema (RED then GREEN)

**Files:**
- Modify: `src/incidents/schemas.ts`
- Modify: `src/incidents/schemas.test.ts` (extend with new assertions)

**Step 1 — Write failing tests for the new fields + IncidentEvent**

In `src/incidents/schemas.test.ts` append:

```ts
import { Incident, IncidentEvent } from './schemas';

describe('Incident schema (v0.2 merged fields)', () => {
  it('accepts the merged complaint fields', () => {
    const parsed = Incident.parse({
      id: 'inc-x',
      status: 'in_progress',
      startedAtISO: '2026-05-23T10:00:00Z',
      title: 'Missed assist at Euston',
      facts: {
        whenISO: '2026-05-23T10:00:00Z',
        mode: 'rail',
        operatorName: 'Avanti West Coast',
        scenarioId: 'missed-passenger-assist',
        narrative: 'No ramp at the door.',
        accompanied: false,
        waitedMinutes: 25,
      },
      templateId: 'missed-passenger-assist',
      draftBody: '# Missed Passenger Assist\n\nDear...',
      recipient: 'customer.resolutions@avantiwestcoast.co.uk',
      sentAtISO: '2026-05-23T11:00:00Z',
      events: [],
    });
    expect(parsed.title).toBe('Missed assist at Euston');
    expect(parsed.facts?.waitedMinutes).toBe(25);
  });

  it('defaults events to []', () => {
    const parsed = Incident.parse({
      id: 'inc-y',
      status: 'draft',
      startedAtISO: '2026-05-23T10:00:00Z',
    });
    expect(parsed.events).toEqual([]);
  });
});

describe('IncidentEvent schema', () => {
  it('accepts an escalated_to_regulator event', () => {
    const parsed = IncidentEvent.parse({
      kind: 'escalated_to_regulator',
      atISO: '2026-07-23T10:00:00Z',
      regulator: 'orr',
      draftBody: 'To the ORR...',
    });
    expect(parsed.kind).toBe('escalated_to_regulator');
  });

  it('accepts an operator_response event', () => {
    const parsed = IncidentEvent.parse({
      kind: 'operator_response',
      atISO: '2026-06-23T10:00:00Z',
      bodyMarkdown: 'We regret...',
    });
    expect(parsed.kind).toBe('operator_response');
  });

  it('rejects an unknown event kind', () => {
    expect(() => IncidentEvent.parse({ kind: 'magic', atISO: '2026-06-23T10:00:00Z' })).toThrow();
  });
});
```

**Step 2 — Run tests, watch them fail**

Run: `pnpm test:unit src/incidents/schemas.test.ts`
Expected: FAIL with "title is not in Incident type" or similar.

**Step 3 — Implement the schema additions**

In `src/incidents/schemas.ts` add (alongside the existing exports):

```ts
import { TransportMode } from '../content/schemas';
import { Regulator } from '../content/schemas';

export const IncidentFacts = z.object({
  whenISO: z.string().datetime().optional(),
  mode: TransportMode.optional(),
  operatorName: z.string().optional(),
  scenarioId: z.string().optional(),
  narrative: z.string().optional(),
  accompanied: z.boolean().optional(),
  staffInteractions: z.string().optional(),
  witnesses: z.string().optional(),
  waitedMinutes: z.number().nonnegative().optional(),
});
export type IncidentFacts = z.infer<typeof IncidentFacts>;

export const IncidentEvent = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('escalated_to_regulator'),
    atISO: z.string().datetime(),
    regulator: Regulator,
    draftBody: z.string(),
  }),
  z.object({
    kind: z.literal('operator_response'),
    atISO: z.string().datetime(),
    bodyMarkdown: z.string(),
  }),
  z.object({
    kind: z.literal('marked_resolved'),
    atISO: z.string().datetime(),
    note: z.string().optional(),
  }),
]);
export type IncidentEvent = z.infer<typeof IncidentEvent>;
```

And extend the existing `Incident`:

```ts
export const Incident = z.object({
  id: z.string().min(1),
  status: IncidentStatus,
  startedAtISO: z.string().datetime(),
  completedAtISO: z.string().datetime().optional(),
  summary: z.string().optional(),
  operatorId: z.string().optional(),
  location: Location.optional(),
  tripId: z.string().optional(),

  // v0.2 merged from Complaint:
  title: z.string().optional(),
  facts: IncidentFacts.optional(),
  templateId: z.string().optional(),
  draftBody: z.string().optional(),
  recipient: z.string().optional(),
  sentAtISO: z.string().datetime().optional(),
  resolvedAtISO: z.string().datetime().optional(),
  reminderId: z.string().optional(),
  events: z.array(IncidentEvent).default([]),
});
```

**Step 4 — Run tests, watch them pass**

Run: `pnpm test:unit src/incidents/schemas.test.ts`
Expected: PASS, with the new 5 assertions green.

**Step 5 — Run full unit suite to confirm no regressions**

Run: `pnpm test:unit`
Expected: all previously-green vitest tests still pass.

**Step 6 — Commit**

```bash
git add src/incidents/schemas.ts src/incidents/schemas.test.ts
git commit -m "feat(incidents): expand schema with merged Complaint fields + events"
```

---

### Task A3 — Update LocalStorage + SQLite incident stores

**Files:**
- Modify: `src/incidents/local-storage-store.ts`
- Modify: `src/incidents/sqlite-store.ts`
- Modify: `src/incidents/local-storage-store.test.ts` (add new tests)

**Step 1 — Write failing tests for the new store methods**

Append to `src/incidents/local-storage-store.test.ts`:

```ts
describe('LocalStorageIncidentStore — v0.2 lifecycle', () => {
  it('saveDraft persists a draft incident with facts and draftBody', () => {
    const store = makeStore();
    const draft = store.saveDraft({
      title: 'Missed assist',
      facts: { mode: 'rail', operatorName: 'Avanti' },
      templateId: 'missed-passenger-assist',
      draftBody: '# Draft body',
      recipient: 'complaints@avanti.com',
    });
    expect(draft.status).toBe('draft');
    expect(store.get(draft.id)?.title).toBe('Missed assist');
    expect(store.get(draft.id)?.draftBody).toContain('Draft body');
  });

  it('markSent transitions draft → in_progress and stamps sentAt', () => {
    const store = makeStore();
    const draft = store.saveDraft({});
    store.markSent(draft.id);
    const after = store.get(draft.id)!;
    expect(after.status).toBe('in_progress');
    expect(after.sentAtISO).toMatch(/^2026-05-23T/);
  });

  it('appendEvent adds an event to the incident', () => {
    const store = makeStore();
    const draft = store.saveDraft({});
    store.markSent(draft.id);
    store.appendEvent(draft.id, {
      kind: 'operator_response',
      atISO: '2026-06-01T10:00:00Z',
      bodyMarkdown: 'We regret...',
    });
    expect(store.get(draft.id)?.events).toHaveLength(1);
  });

  it('markCompleted transitions to completed and stamps resolvedAt', () => {
    const store = makeStore();
    const draft = store.saveDraft({});
    store.markSent(draft.id);
    store.markCompleted(draft.id);
    const after = store.get(draft.id)!;
    expect(after.status).toBe('completed');
    expect(after.resolvedAtISO).toBeTruthy();
  });
});
```

**Step 2 — Run tests, watch them fail**

Run: `pnpm test:unit src/incidents/local-storage-store.test.ts`
Expected: FAIL — `saveDraft / markSent / appendEvent / markCompleted` don't exist.

**Step 3 — Add the new methods to the IncidentStore interface**

In `src/incidents/store.ts` extend `IncidentStore`:

```ts
export interface DraftInput {
  title?: string;
  operatorId?: string;
  location?: Location;
  facts?: IncidentFacts;
  templateId?: string;
  draftBody?: string;
  recipient?: string;
}

export interface IncidentStore {
  // existing:
  start(input: IncidentStartInput): Incident;
  get(id: string): Incident | null;
  listInProgress(): Incident[];
  listAll(): Incident[];
  markComplete(id: string, summary?: string): void;   // keep — used by old code temporarily
  discard(id: string): void;
  attachMedia(incidentId: string, m: MediaInput): MediaRef;
  mediaFor(incidentId: string): MediaRef[];

  // v0.2 additions:
  saveDraft(input: DraftInput): Incident;
  markSent(id: string): void;
  markCompleted(id: string): void;
  appendEvent(id: string, event: IncidentEvent): void;
  listByStatus(status: 'draft' | 'in_progress' | 'completed'): Incident[];
}
```

**Step 4 — Implement in LocalStorageIncidentStore**

Add the four new methods. `saveDraft` generates an id, status `'draft'`, copies fields through. `markSent` updates status + `sentAtISO`. `markCompleted` updates status + `resolvedAtISO` and appends a `marked_resolved` event. `appendEvent` pushes to the array, validates via `Incident.parse`. `listByStatus` filters.

**Step 5 — Implement in SqliteIncidentStore (mirror the changes)**

For `events_json` column, store as JSON string; parse on read. Add helpers `parseEventsJson(r.events_json)` and `serializeEvents(arr)`.

**Step 6 — Run tests, watch them pass**

Run: `pnpm test:unit`
Expected: 4 new tests pass; nothing else broken.

**Step 7 — Commit**

```bash
git add src/incidents/store.ts src/incidents/local-storage-store.ts src/incidents/sqlite-store.ts src/incidents/local-storage-store.test.ts
git commit -m "feat(incidents): store gains saveDraft / markSent / markCompleted / appendEvent / listByStatus"
```

---

### Task A4 — Move template engine + outputs from `src/complaints/` to `src/incidents/`

**Files:**
- Rename: `src/complaints/templates/` → `src/incidents/templates/`
- Rename: `src/complaints/assemble.ts` → `src/incidents/assemble.ts`
- Rename: `src/complaints/outputs.ts` → `src/incidents/outputs.ts`
- Rename: `src/complaints/schemas.ts` (ComplaintTemplate) → `src/incidents/template-schemas.ts`
- Rename: `src/complaints/StatusBadge.tsx` → `src/incidents/StatusBadge.tsx` (with status enum update — see A5)
- Rename their `.test.ts(x)` files alongside

**Step 1 — git mv the files (preserves history)**

```bash
git mv src/complaints/templates src/incidents/templates
git mv src/complaints/assemble.ts src/incidents/assemble.ts
git mv src/complaints/assemble.test.ts src/incidents/assemble.test.ts
git mv src/complaints/outputs.ts src/incidents/outputs.ts
git mv src/complaints/outputs.test.ts src/incidents/outputs.test.ts
git mv src/complaints/schemas.ts src/incidents/template-schemas.ts
git mv src/complaints/schemas.test.ts src/incidents/template-schemas.test.ts
git mv src/complaints/StatusBadge.tsx src/incidents/StatusBadge.tsx
git mv src/complaints/StatusBadge.test.tsx src/incidents/StatusBadge.test.tsx
```

**Step 2 — Fix imports in the moved files**

The moved files import from `'./schemas'` (which was Complaint) and `'../incidents/...'`. Now they need to import from `'./template-schemas'` for the template, and `'./schemas'` resolves to incident schemas. Run search-and-replace:

```bash
# In the moved files only:
sed -i '' "s#from './schemas'#from './template-schemas'#g" src/incidents/templates/index.ts src/incidents/assemble.ts
```

Then check `src/incidents/assemble.ts` — it also imports `Incident` and `Profile`. Update if the paths drifted.

**Step 3 — Fix imports in the rest of the codebase**

Find all files that still reference `src/complaints/templates`, `src/complaints/assemble`, `src/complaints/outputs`, `src/complaints/schemas`, `src/complaints/StatusBadge`:

```bash
grep -rl "src/complaints/templates\|src/complaints/assemble\|src/complaints/outputs\|src/complaints/StatusBadge\|src/complaints/schemas" app src tests
```

Update each to point at `src/incidents/...`.

**Step 4 — Run typecheck**

Run: `pnpm typecheck`
Expected: clean. If errors, fix the imports they call out.

**Step 5 — Run tests**

Run: `pnpm test`
Expected: all green; the moved tests now pass under their new paths.

**Step 6 — Commit**

```bash
git add -A
git commit -m "refactor: move templates / assemble / outputs / StatusBadge from complaints/ to incidents/"
```

---

### Task A5 — Reduce status enum to 3 values; delete old Complaint store

**Files:**
- Modify: `src/incidents/StatusBadge.tsx` (drop sent/acknowledged/resolved/escalated/draft → 3 values: draft/in_progress/completed)
- Delete: `src/complaints/complaint-schemas.ts`, `complaint-store.ts`, `complaint-store.test.ts`, `local-storage-complaint-store.ts`, `sqlite-complaint-store.ts`, `factory.ts`, `reminders.ts` (the reminders helper moves to `src/incidents/reminders.ts`)
- Delete: `app/complaints/` (whole directory)
- Delete: `app/compose.tsx`
- Move: `src/complaints/reminders.ts` → `src/incidents/reminders.ts` (it operates on incident ids now)
- Move: `src/complaints/ComplaintComposerScreen.tsx` + test → DELETE (the Report flow replaces it in Phase B)

**Step 1 — Move reminders**

```bash
git mv src/complaints/reminders.ts src/incidents/reminders.ts
```

Update the type signature: `scheduleEightWeekReminder({ complaintId, ... })` → `scheduleEightWeekReminder({ incidentId, ... })`. No other code change needed; the implementation is opaque.

**Step 2 — Delete the rest of `src/complaints/`**

```bash
git rm -r src/complaints
git rm -r app/complaints
git rm app/compose.tsx
```

**Step 3 — Update StatusBadge**

Edit `src/incidents/StatusBadge.tsx`. Change the type alias:

```ts
import type { IncidentStatus } from './schemas';

const LABELS: Record<IncidentStatus, string> = {
  draft: 'Draft',
  in_progress: 'In progress',
  completed: 'Completed',
};

const COLORS: Record<IncidentStatus, { bg: string; text: string }> = {
  draft: colors.status.draft,
  in_progress: colors.status.sent,       // reuse the cool blue tone
  completed: colors.status.resolved,
};
```

Update the test in `src/incidents/StatusBadge.test.tsx` to assert the new 3 labels.

**Step 4 — Run tests — many existing tests reference deleted complaint things**

Run: `pnpm test`
Expected: a wave of failures referencing complaint-store, ComplaintComposerScreen, etc.

**Step 5 — Delete tests for deleted features**

```bash
# Anything still expecting the old complaint code:
git rm src/complaints/*.test.* 2>/dev/null || true
```

Run `pnpm test` again. Expected: green.

**Step 6 — Run typecheck + e2e**

Run: `pnpm typecheck`
Expected: clean.

`pnpm test:e2e` will fail because home screen + complaint flow tests still exist. We fix those in Phase B (when we remove the screens that the tests query). For now just record the expected failures.

**Step 7 — Commit**

```bash
git add -A
git commit -m "refactor: delete Complaint module; status enum reduced to 3 values"
```

---

## Phase B — The 3-tab IA + new screens

Goal: ship the new navigation and all new screens; delete the old Home + Directory + Share routes.

### Task B1 — Tab layout

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/incidents.tsx` (just `export { default } from '../../src/screens/IncidentsListScreen';` for now — implemented in B2)
- Create: `app/(tabs)/passport.tsx` (re-parent from `app/profile/index.tsx`)
- Create: `app/(tabs)/settings.tsx` (re-parent from `app/settings.tsx`)
- Delete: `app/index.tsx` (the standalone Home — replaced by the tab group)

**Step 1 — Create the tab layout**

`app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.base,
        tabBarInactiveTintColor: colors.ink.muted,
        tabBarStyle: { backgroundColor: colors.bg.paper, borderTopColor: colors.line.hairline },
      }}
    >
      <Tabs.Screen name="incidents" options={{ title: 'Incidents' }} />
      <Tabs.Screen name="passport" options={{ title: 'Passport' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

**Step 2 — Re-parent Passport + Settings**

Move the existing screens behind one-liner tab files:

```tsx
// app/(tabs)/passport.tsx
export { default } from '../profile/index';
```

```tsx
// app/(tabs)/settings.tsx
export { default } from '../settings';
```

Wait — `app/settings.tsx` is a file, not a directory. Move it: `git mv app/settings.tsx app/(tabs)/settings.tsx`. Same for passport: `git mv app/profile/index.tsx app/(tabs)/passport.tsx`.

Now `app/profile/edit.tsx` still exists for the editor; it lives outside the tab group but is pushed onto the stack when invoked from Passport.

**Step 3 — Stub incidents tab**

```tsx
// app/(tabs)/incidents.tsx
import { Text } from 'react-native';
import { AppShell } from '../../src/components/AppShell';
import { AppHeader } from '../../src/components/AppHeader';

export default function IncidentsTab() {
  return (
    <AppShell back={false}>
      <AppHeader title="Incidents" overline="Today" />
      <Text>Implemented in Task B2.</Text>
    </AppShell>
  );
}
```

**Step 4 — Delete the old Home and `app/onboarding.tsx` redirect**

```bash
git rm app/index.tsx
```

Onboarding stays in place for now (Phase C wires it into the Passport empty state).

**Step 5 — Regenerate typedRoutes + run**

```bash
CI=1 pnpm start --web &
sleep 10
kill %1 2>/dev/null
pkill -f "node.*expo/bin/cli.*start" 2>/dev/null
pnpm typecheck
```

Expected: typecheck clean (router.d.ts now knows about `/(tabs)/incidents` etc.). Failing tests will say things like "module ../../app/index not found" — that's expected; we delete those tests in B2.

**Step 6 — Commit**

```bash
git add -A
git commit -m "feat(nav): three-tab IA — Incidents (default) / Passport / Settings"
```

---

### Task B2 — Incidents list screen (filter + new-report CTA)

**Files:**
- Create: `src/screens/IncidentsListScreen.tsx`
- Create: `src/screens/IncidentsListScreen.test.tsx` (RNTL)
- Modify: `app/(tabs)/incidents.tsx` to render the new screen
- Delete: `tests/app/index.test.tsx`, `tests/app/directory/`, `app/incidents/index.tsx` (re-parented), `app/directory/`

**Step 1 — Write failing tests**

```tsx
// src/screens/IncidentsListScreen.test.tsx
import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { IncidentsListScreen } from './IncidentsListScreen';

const baseIncidents = [
  { id: 'i1', status: 'draft', startedAtISO: '2026-05-23T10:00:00Z', title: 'Euston', events: [] },
  { id: 'i2', status: 'in_progress', startedAtISO: '2026-05-20T10:00:00Z', title: 'Manchester', sentAtISO: '2026-05-20T11:00:00Z', events: [] },
  { id: 'i3', status: 'completed', startedAtISO: '2026-04-01T10:00:00Z', title: 'Crewe', events: [] },
] as const;

describe('IncidentsListScreen', () => {
  it('renders the new-report CTA prominently', () => {
    render(<IncidentsListScreen incidents={[]} onNewReport={() => {}} onOpenIncident={() => {}} />);
    expect(screen.getByRole('button', { name: /start a new report/i })).toBeTruthy();
  });

  it('renders the three filter chips with row counts', () => {
    render(<IncidentsListScreen incidents={baseIncidents as never} onNewReport={() => {}} onOpenIncident={() => {}} />);
    expect(screen.getByRole('button', { name: /drafts \(1\)/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /in progress \(1\)/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /completed \(1\)/i })).toBeTruthy();
  });

  it('defaults to the In Progress filter', () => {
    render(<IncidentsListScreen incidents={baseIncidents as never} onNewReport={() => {}} onOpenIncident={() => {}} />);
    expect(screen.queryByText('Manchester')).toBeTruthy();
    expect(screen.queryByText('Euston')).toBeNull();
  });

  it('switching to Drafts shows draft rows', () => {
    render(<IncidentsListScreen incidents={baseIncidents as never} onNewReport={() => {}} onOpenIncident={() => {}} />);
    fireEvent.press(screen.getByRole('button', { name: /drafts/i }));
    expect(screen.getByText('Euston')).toBeTruthy();
    expect(screen.queryByText('Manchester')).toBeNull();
  });

  it('tapping a row calls onOpenIncident with the id', () => {
    const onOpenIncident = jest.fn<(id: string) => void>();
    render(<IncidentsListScreen incidents={baseIncidents as never} onNewReport={() => {}} onOpenIncident={onOpenIncident} />);
    fireEvent.press(screen.getByText('Manchester'));
    expect(onOpenIncident).toHaveBeenCalledWith('i2');
  });

  it('tapping Start a new report calls onNewReport', () => {
    const onNewReport = jest.fn();
    render(<IncidentsListScreen incidents={[]} onNewReport={onNewReport} onOpenIncident={() => {}} />);
    fireEvent.press(screen.getByRole('button', { name: /start a new report/i }));
    expect(onNewReport).toHaveBeenCalledTimes(1);
  });

  it('shows an empty-state message when the active filter is empty', () => {
    render(<IncidentsListScreen incidents={[]} onNewReport={() => {}} onOpenIncident={() => {}} />);
    expect(screen.getByText(/no incidents in progress/i)).toBeTruthy();
  });
});
```

**Step 2 — Run, watch fail**

Run: `pnpm test:rn src/screens/IncidentsListScreen.test.tsx`
Expected: module-not-found.

**Step 3 — Implement**

```tsx
// src/screens/IncidentsListScreen.tsx
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '../components/AppShell';
import { AppHeader } from '../components/AppHeader';
import { EmergencyCard } from '../components/EmergencyCard';
import { DestinationCard } from '../components/DestinationCard';
import { ProfileChip } from '../components/ProfileChip';
import { StatusBadge } from '../incidents/StatusBadge';
import { colors, space, type } from '../theme';
import type { Incident } from '../incidents/schemas';

type Filter = 'draft' | 'in_progress' | 'completed';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'draft', label: 'Drafts' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

const EMPTY: Record<Filter, string> = {
  draft: 'No drafts. Tap Start a new report to begin.',
  in_progress: 'No incidents in progress.',
  completed: 'No completed incidents yet.',
};

interface Props {
  incidents: Incident[];
  onNewReport: () => void;
  onOpenIncident: (id: string) => void;
}

export function IncidentsListScreen({ incidents, onNewReport, onOpenIncident }: Props) {
  const [filter, setFilter] = useState<Filter>('in_progress');
  const counts = FILTERS.reduce<Record<Filter, number>>(
    (acc, f) => ({ ...acc, [f.id]: incidents.filter((i) => i.status === f.id).length }),
    { draft: 0, in_progress: 0, completed: 0 }
  );
  const visible = incidents.filter((i) => i.status === filter);

  return (
    <AppShell back={false}>
      <AppHeader title="Incidents" overline="Today" />
      <EmergencyCard
        title="Start a new report"
        caption="Tell AccessMate what happened — we'll guide you through it."
        onPress={onNewReport}
      />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <ProfileChip
            key={f.id}
            label={`${f.label} (${counts[f.id]})`}
            selected={filter === f.id}
            onToggle={() => setFilter(f.id)}
          />
        ))}
      </View>
      {visible.length === 0 ? (
        <Text style={styles.empty}>{EMPTY[filter]}</Text>
      ) : (
        <View>
          {visible.map((item) => (
            <View key={item.id} style={styles.row}>
              <DestinationCard
                title={item.title ?? 'Untitled incident'}
                caption={`${item.startedAtISO.slice(0, 10)} · ${item.facts?.operatorName ?? ''}`}
                onPress={() => onOpenIncident(item.id)}
              />
              <View style={styles.badge}>
                <StatusBadge status={item.status} />
              </View>
            </View>
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap' },
  empty: { ...type.body, color: colors.ink.muted },
  row: { position: 'relative' },
  badge: { position: 'absolute', right: space.lg, top: space.base },
});
```

**Step 4 — Wire the route file**

```tsx
// app/(tabs)/incidents.tsx
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { IncidentsListScreen } from '../../src/screens/IncidentsListScreen';
import { getIncidentStore } from '../../src/incidents/factory';

export default function IncidentsTab() {
  const router = useRouter();
  const store = useMemo(() => getIncidentStore(), []);
  const [incidents] = useState(() => store.listAll());
  return (
    <IncidentsListScreen
      incidents={incidents}
      onNewReport={() => router.push('/report')}
      onOpenIncident={(id) => router.push({ pathname: '/incidents/[id]', params: { id } })}
    />
  );
}
```

**Step 5 — Delete the obsolete tests + old routes**

```bash
git rm tests/app/index.test.tsx
git rm -r tests/app/directory
git rm -r app/directory
git rm -r app/incident
# the existing app/incidents/[id].tsx stays — that's the detail route, still wanted
```

**Step 6 — Run all tests, e2e, typecheck**

```bash
pnpm test
pnpm typecheck
pnpm test:e2e   # several e2e tests still reference Home/Plan-a-trip — expect failures, fix in B3
```

**Step 7 — Commit**

```bash
git add -A
git commit -m "feat(incidents): list screen with filter chips + new-report CTA"
```

---

### Task B3 — Update E2E smokes for the new IA

**Files:**
- Modify: `e2e/web/smoke.spec.ts` — rewrite tests that referenced Home / Directory / Plan-a-trip

**Step 1 — Update each test**

Replace:
- `await page.getByRole('button', { name: /plan a trip/i }).click()` flows → delete (Directory is gone)
- `await page.getByRole('button', { name: /your accessibility passport/i }).click()` → `await page.getByRole('button', { name: 'Passport' }).click()` (tab bar)
- `await page.getByRole('button', { name: /something went wrong/i }).click()` → `await page.getByRole('button', { name: /start a new report/i }).click()`
- `await page.getByRole('button', { name: /recent incidents/i }).click()` → delete; default tab is Incidents
- `await page.getByRole('button', { name: /^complaints$/i }).click()` → delete

Keep:
- The axe-clean assertion on the default landing screen.
- The passport edit flow (now reached via Passport tab).
- The new-report flow (rewritten to walk through the conversation modal — see Phase D).

**Step 2 — Run e2e**

Run: `pnpm test:e2e`
Expected: any tests we haven't yet rewritten fail with locator-not-found; tests pinned to the new IA pass. Skip-mark anything that depends on Phase D (the new Report flow) until that phase is implemented.

**Step 3 — Commit**

```bash
git add e2e/web/smoke.spec.ts
git commit -m "test(e2e): update smokes for 3-tab IA; mark Report-flow tests as pending"
```

---

## Phase C — Incident detail with timeline + status actions

### Task C1 — Detail screen (pure component)

**Files:**
- Create: `src/screens/IncidentDetailScreen.tsx` (pure)
- Create: `src/screens/IncidentDetailScreen.test.tsx`
- Modify: `app/incidents/[id].tsx` (thin wrapper)

**Step 1 — Write tests covering each status's available actions**

```tsx
describe('IncidentDetailScreen', () => {
  const baseDraft = {
    id: 'd1', status: 'draft', startedAtISO: '2026-05-23T10:00:00Z',
    title: 'Test', events: [],
  } as Incident;

  it('Draft → shows Edit / Send / Discard', () => {
    const { getByRole } = render(<IncidentDetailScreen incident={baseDraft} {...noopHandlers} />);
    expect(getByRole('button', { name: /edit draft/i })).toBeTruthy();
    expect(getByRole('button', { name: /^send$/i })).toBeTruthy();
    expect(getByRole('button', { name: /discard/i })).toBeTruthy();
  });

  it('In Progress → shows Operator replied / Escalate / Mark resolved', () => {
    // ...
  });

  it('Completed → shows Export PDF / Re-open', () => {
    // ...
  });

  it('renders the timeline from events[]', () => {
    // verify sub-event labels appear chronologically
  });
});
```

**Step 2 — RED**

**Step 3 — Implement (pure component takes incident + onEdit/onSend/onDiscard/onOperatorReplied/onEscalate/onMarkResolved/onExportPdf/onReopen)**

**Step 4 — Wire `app/incidents/[id].tsx` to the store**

**Step 5 — GREEN**

**Step 6 — Commit**

```bash
git commit -m "feat(incidents): detail screen with timeline + status-contextual actions"
```

---

## Phase D — The Report flow (modal route)

### Task D1 — Modal route shell + flow router

**Files:**
- Create: `app/report.tsx` (modal route)
- Add to `app/_layout.tsx`: register `report` as a `presentation: 'modal'` stack screen

**Step 1 — Add the modal screen to root layout**

In `app/_layout.tsx` between the `<Tabs />` and `</TamaguiProvider>`, restructure to use a `<Stack>` that contains both `(tabs)` and `report`:

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="report" options={{ presentation: 'modal' }} />
  <Stack.Screen name="incidents/[id]" />
  <Stack.Screen name="profile/edit" />
  <Stack.Screen name="onboarding" />
</Stack>
```

**Step 2 — Create the route file**

```tsx
// app/report.tsx
import { useState } from 'react';
import { ReportFlow } from '../src/screens/ReportFlow';

export default function ReportRoute() {
  return <ReportFlow />;
}
```

**Step 3 — Create the placeholder ReportFlow that picks AI vs form**

```tsx
// src/screens/ReportFlow.tsx
// Decides whether to render ReportConversation (AI) or ReportForm (template)
// based on Apple FM availability + Settings.aiProvider.
```

For this task, just return a placeholder that says "Report flow placeholder — wired in D2/D3". Tests come with D2/D3.

**Step 4 — Verify modal presents from the Incidents tab**

`pnpm ios` and tap the Start a new report card — sheet should slide up.

**Step 5 — Commit**

```bash
git commit -m "feat(report): modal route + flow shell"
```

---

### Task D2 — Template-fallback form (no AI required)

This goes first because it's testable without any AI mock.

**Files:**
- Create: `src/screens/ReportForm.tsx` (pure)
- Create: `src/screens/ReportForm.test.tsx`

**Step 1 — Tests**

```tsx
describe('ReportForm', () => {
  it('walks 4 steps and produces a draft via assembleDraft', () => {
    const onComplete = jest.fn<(draft) => void>();
    render(<ReportForm operators={[mockAvanti]} templates={mockTemplates} onComplete={onComplete} onCancel={() => {}} />);
    // step 1: pick date — defaults to today, just tap Next
    fireEvent.press(screen.getByRole('button', { name: /next/i }));
    // step 2: pick operator
    fireEvent.press(screen.getByText('Avanti West Coast'));
    fireEvent.press(screen.getByRole('button', { name: /next/i }));
    // step 3: pick scenario
    fireEvent.press(screen.getByText('Missed Passenger Assist'));
    fireEvent.press(screen.getByRole('button', { name: /next/i }));
    // step 4: alone or accompanied?
    fireEvent.press(screen.getByText('Alone'));
    fireEvent.press(screen.getByRole('button', { name: /draft/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const { draftBody, templateId, facts } = onComplete.mock.calls[0][0];
    expect(templateId).toBe('missed-passenger-assist');
    expect(draftBody).toContain('Avanti West Coast');
    expect(facts.accompanied).toBe(false);
  });
});
```

**Step 2 — RED, then implement, then GREEN, then commit.**

---

### Task D3 — Conversational AI flow

**Files:**
- Create: `src/screens/ReportConversation.tsx` (pure component takes `messages`, `onSend`, `onDraft`, `onSwitchToForm`)
- Create: `src/screens/ReportConversation.test.tsx`
- Create: `src/ai/intake.ts` — orchestrates the AI turn loop, given the existing `polishViaAppleFm` / `polishViaCloud`. New function `nextQuestion(facts, lastUserTurn) → { question, isDone, extractedFacts }`.
- Create: `src/ai/intake.test.ts`

**Step 1 — Define the intake's pure data flow**

`nextQuestion` is a pure function from current state + last user message + AI adapter. Tests use a fake AI adapter that returns scripted responses to verify the loop calls the AI, merges extracted facts, asks the next question, and exits when `isDone === true`.

**Step 2 — Tests, then RED, then implement, then GREEN, then commit.**

---

### Task D4 — ReportFlow wiring (AI ↔ form switch + save/send)

**Files:**
- Modify: `src/screens/ReportFlow.tsx`
- Modify: `app/report.tsx` to wire stores + router

`ReportFlow`:
1. On mount, check Apple FM availability (`defaultAppleFmModule()?.isAvailable()`) and `Settings.aiProvider`.
2. Mount `ReportConversation` if AI available + provider != 'off', else `ReportForm`.
3. Both children produce a `Draft` object on completion.
4. On completion: `getIncidentStore().saveDraft(draft)` → close modal → navigate to `/incidents/[id]` with the new id.
5. The "Use the form instead" link inside `ReportConversation` swaps to `ReportForm` with any structured facts already extracted.

**Step 1 — Tests, then RED, then implement, then GREEN, then commit.**

---

### Task D5 — Update E2E for the template path

Add a Playwright test that walks: open Incidents → tap Start a new report → walk the 4-step form → land on the new incident detail. Skip the AI-conversation E2E (Playwright can't drive Apple FM).

```bash
git commit -m "test(e2e): cover the template-fallback Report flow end to end"
```

---

## Phase E — Liquid Glass on iOS

### Task E1 — Native module skeleton

**Files:**
- Create: `modules/glass-surface/expo-module.config.json`
- Create: `modules/glass-surface/package.json`
- Create: `modules/glass-surface/src/index.ts` (native re-export)
- Create: `modules/glass-surface/src/index.web.ts` (paper fallback as a plain `<View>`)
- Create: `modules/glass-surface/src/GlassSurface.types.ts`
- Create: `modules/glass-surface/ios/GlassSurfaceView.swift` (wraps `UIGlassMaterialView`)
- Create: `modules/glass-surface/ios/GlassSurfaceModule.swift` (registers the view)
- Create: `modules/glass-surface/ios/GlassSurface.podspec`
- Create: `modules/glass-surface/tsconfig.json`

Mirrors `modules/apple-fm/` exactly in shape. The Swift view is one `UIView` subclass that internally hosts a `UIGlassMaterialView` when `#available(iOS 26.0, *)`, otherwise falls back to a plain UIView with a tinted background. Honour `UIAccessibility.isReduceTransparencyEnabled` via NotificationCenter.

**Step 1 — Scaffold files. No tests; this is integration-tested in E3.**

**Step 2 — Commit**

```bash
git commit -m "feat(glass): scaffold modules/glass-surface — iOS UIGlassMaterialView wrapper"
```

---

### Task E2 — Cool charcoal palette + GlassSurface component

**Files:**
- Create: `src/theme/glass.ts` — iOS-only palette tokens (`#1A1D24` canvas, `#FF6A4D` accent, etc.)
- Create: `src/components/GlassSurface.tsx` — picks native module on iOS, paper `<View>` elsewhere.
- Modify: `src/theme/index.ts` to export `glassColors`.

`GlassSurface` props: `{ tint?: 'chrome' | 'card' | 'sheet'; children; style? }`.

**Step 1 — Create files, no tests (visual).**

**Step 2 — Commit**

```bash
git commit -m "feat(glass): GlassSurface component + glass palette"
```

---

### Task E3 — Adopt GlassSurface on iOS chrome

**Files:**
- Modify: `app/(tabs)/_layout.tsx` — wrap Tabs.Screen content in `GlassSurface tint='chrome'` for the tab bar background.
- Modify: `src/components/AppShell.tsx` — when on iOS, wrap header / modal-sheet root in `GlassSurface tint='sheet'`; switch the background colour to `glassColors.canvas`.
- Modify: `app/_layout.tsx` — set the `Stack` `contentStyle.backgroundColor` to `glassColors.canvas` on iOS, `colors.bg.paper` elsewhere.

**Step 1 — Manual smoke in iOS Simulator**

Run: `pnpm prebuild --platform ios --clean && pnpm ios`
Visually confirm: tab bar is glassy, content reads correctly, Reduce Transparency in Simulator's Settings → Accessibility → Display & Text Size correctly falls back.

**Step 2 — Re-run web E2E to confirm Android/web path unchanged**

Run: `pnpm test:e2e`
Expected: all green.

**Step 3 — Commit**

```bash
git commit -m "feat(glass): adopt GlassSurface on iOS tab bar + sheet chrome"
```

---

## Phase F — Cleanup, tag, push

### Task F1 — Onboarding inside Passport empty state

**Files:**
- Delete: `app/onboarding.tsx`
- Modify: `app/(tabs)/passport.tsx` — when `getProfileStore().get()` returns null AND `Settings.onboardingComplete === false`, render the wizard inline instead of the passport view.

**Step 1 — Move the wizard component out of the route**

Extract `app/onboarding.tsx`'s body into `src/screens/OnboardingWizard.tsx`. The route file becomes unused; delete it.

**Step 2 — Wire from Passport tab**

```tsx
export default function PassportTab() {
  const settings = useMemo(() => getSettingsStore(), []);
  const profile = useMemo(() => getProfileStore().get(), []);
  if (!profile && !settings.get().onboardingComplete) {
    return <OnboardingWizard onFinish={() => router.replace('/(tabs)/passport')} />;
  }
  return <PassportView profile={profile ?? EMPTY} ... />;
}
```

**Step 3 — Update the E2E onboarding test to navigate via the Passport tab**

**Step 4 — Commit**

```bash
git commit -m "refactor(onboarding): live inside Passport empty state instead of being a route"
```

---

### Task F2 — Final sweep + tag

**Step 1 — Search the codebase for any stray references to deleted concepts**

```bash
grep -rl "directory\|share\|complaints\|compose\|ResumeBanner" app src tests | grep -v node_modules
```

Fix any survivors.

**Step 2 — Update the project plan doc**

Append a Batch 4 status block to `docs/plans/2026-05-21-accessmate-implementation-plan.md` with all commit hashes from this run.

**Step 3 — Final verification**

```bash
pnpm test && pnpm test:e2e && pnpm lint && pnpm typecheck
```

All green.

**Step 4 — Tag v0.2.0**

```bash
git tag -a v0.2.0 -m "v0.2.0 — three-pillar scope cut + Liquid Glass on iOS"
git push --tags origin main
```

---

## Out of scope for this plan

- Android Gemini Nano adapter (still device-gated)
- Encrypted cross-device sync (still mobile-only)
- The other ~20 operators (still research)
- Phase 12 audit + community testing + store accounts

These remain noted in the 2026-05-21 implementation plan.

---

## Working principles for every task

- TDD strictly: red → green → commit. `@superpowers:test-driven-development` is your loop.
- Frequent commits: per task, sometimes per step.
- Migrations are append-only — never edit a shipped migration.
- A11y is a release gate: every new screen must keep `accessibilityRole + accessibilityLabel` on every interactive element; axe E2E must stay green.
- Use the existing AppShell + AppHeader + DestinationCard + EmergencyCard + ProfileChip + StatusBadge primitives; do not introduce new shape patterns.
- When stuck on a non-trivial bug, use `@superpowers:systematic-debugging` before guessing.
- When the Apple FM module needs verification, follow the manual loop in `modules/apple-fm/`'s comments — `pnpm prebuild --platform ios --clean && pnpm ios`.
