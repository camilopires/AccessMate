# AccessMate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Build AccessMate v1 — a cross-platform (Expo + RN Web) UK accessibility travel companion covering Directory, Accessibility Passport, and Complaint helper, with on-device AI preferred and cloud Claude as fallback.

**Architecture:** Single Expo monorepo (TypeScript). Local-first storage (expo-sqlite + expo-file-system). Bundled content (operators + complaint templates) shipped via Expo OTA. AI adapter selects Apple Foundation Models → Gemini Nano via AICore → Cloudflare Worker → template-only. Optional user-encrypted sync via OS document pickers. WCAG 2.2 AA as a release gate.

**Tech Stack:** Expo SDK 50+, React Native, React Native Web, TypeScript, Expo Router, expo-sqlite, expo-file-system, Tamagui (UI), Zod (schemas), Vitest (unit/component), React Native Testing Library, Maestro (mobile E2E — added in Phase 3), Playwright + axe-core (web E2E + a11y), Cloudflare Workers + Hono (AI proxy — Phase 11), Anthropic Claude SDK.

**Design source:** `docs/plans/2026-05-21-a11y-travel-companion-design.md`

---

## Plan structure (read this first)

This plan is split into 12 phases. **Phase 1 is fully decomposed into TDD-grade bite-sized tasks**; Phases 2–12 are sketched as task lists with intent, scope, and acceptance criteria.

The reason: TDD task granularity is most valuable when the work is imminent. Decomposing Phase 6 today would produce a long document we'd half-rewrite once Phase 1–5 land and we learn what the real shape is. **At the start of each phase, re-invoke `superpowers:writing-plans` to expand that phase's sketch into TDD tasks.**

**Phase order, milestones, and the v1 cut-line are non-negotiable.** Task counts inside later phases are estimates.

---

## Phase order at a glance

| # | Phase | Goal | Ships? |
|---|---|---|---|
| 0 | Prerequisites | One-time machine + account setup | n/a |
| 1 | Foundations + thin slice | Expo app shell + Directory screen with one operator | Internal v0.1 |
| 2 | Accessibility Passport | Profile data model, screen, PDF export | Internal v0.2 |
| 3 | Incident capture | Camera/mic/GPS capture, local storage of evidence | Internal v0.3 |
| 4 | Complaint composer (template-only) | Scenario templates + draft assembly, no AI yet | Internal v0.4 |
| 5 | Complaint tracker + reminders | Status tracking + 8-week escalation reminder | Internal v0.5 |
| 6 | Share composer | Redaction + per-platform sizing | Internal v0.6 |
| 7 | Settings (sync, prefs, wipe) | User-encrypted sync, a11y prefs, data export | Internal v0.7 |
| 8 | Onboarding wizard | 5-question first-run profile setup | Internal v0.8 |
| 9 | Cloud AI proxy | Cloudflare Worker → Claude with validators | Internal v0.9 |
| 10 | On-device AI adapters | Apple FM (iOS) + Gemini Nano (Android) Expo modules | Internal v0.10 |
| 11 | OTA content + authoring | Versioned bundles, rollback, content workflow | Internal v0.11 |
| 12 | a11y audit + community testing + public beta | Recruit testers, fix, publish | **Public beta v1.0** |

---

## Phase 0 — Prerequisites (one-time, not numbered tasks)

Before Phase 1 Task 1, confirm you have:

- **Node ≥20.x** (`node --version`) and **pnpm ≥9** (`pnpm --version`). Install pnpm: `npm i -g pnpm`.
- **Git ≥2.40** (already in use).
- **Xcode ≥15** with command-line tools (`xcode-select --install`). iOS Simulator runtime installed for iOS 17/18.
- **Watchman** (`brew install watchman`) — Metro bundler needs it for file watching.
- **Expo CLI** is included per-project via `npx expo`; no global install needed.
- **Android Studio** — *optional for Phase 1* (web + iOS sim is enough). Required by Phase 3 for Android device testing and Phase 10 for the AICore module.
- **Cloudflare account** — needed in Phase 9.
- **Anthropic API key** — needed in Phase 9. Stored only on Cloudflare Worker, never on device.
- **Apple Developer + Google Play accounts** — needed for Phase 12 (TestFlight + Play closed testing).

If any of these are missing, install them now. The plan assumes they're in place from Task 1.

---

# Phase 1 — Foundations + thin slice

**Goal:** A running Expo app on iOS sim and web with a working Directory screen showing one real UK operator entry (Avanti West Coast). All foundational tooling (Vitest, RNTL, Playwright + axe, ESLint with jsx-a11y, Zod schemas, SQLite scaffolding) wired up. End state: any future task starts with "the test runner works, the type checker works, the a11y check works, push a button on iOS sim and you see Avanti's assistance number."

**Acceptance criteria:**
1. `pnpm test` runs Vitest unit + component tests and they pass.
2. `pnpm test:e2e` runs Playwright + axe on the web build, both pass.
3. `pnpm lint` runs ESLint (with jsx-a11y) and it passes.
4. `pnpm typecheck` runs `tsc --noEmit` and it passes.
5. `pnpm ios` opens iOS sim showing Home with three big-tap actions; tap Directory → see Avanti → tap-to-call opens `tel:` URL.
6. `pnpm web` serves the same in a browser.
7. Tagged `v0.1.0` in git.

---

### Task 1.1 — Scaffold the Expo app

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `app/_layout.tsx`, `app/index.tsx`, plus `.expo/`, `assets/` (auto-generated)
- Modify: `.gitignore` (already correct from previous commit)

**Step 1 — Create the project in-place**

Run (from inside the repo root, with the existing `docs/` and `.gitignore` already there):

```bash
pnpm dlx create-expo-app@latest . \
  --template default \
  --no-install \
  --yes
```

Expected: scaffolds Expo files alongside the existing `docs/` and `.gitignore`. If it refuses to scaffold into a non-empty dir, run it into a temp dir and move the files in: `pnpm dlx create-expo-app@latest /tmp/_accessmate-init --template default --no-install --yes && rsync -a --ignore-existing /tmp/_accessmate-init/ ./ && rm -rf /tmp/_accessmate-init`.

**Step 2 — Install dependencies**

```bash
pnpm install
```

Expected: `node_modules/` populated; no peer-dep errors.

**Step 3 — Pin the Expo SDK version**

Open `package.json`. Confirm `"expo": "~50.0.0"` (or whatever the latest stable major is at time of running — pin exact minor with `~`, not `^`, so we don't auto-jump majors).

**Step 4 — Sanity check**

```bash
pnpm start --web --non-interactive &
sleep 8 && curl -s http://localhost:8081 | head -1
kill %1
```

Expected: HTML response starting with `<!DOCTYPE html>`.

**Step 5 — Commit**

```bash
git add .
git commit -m "chore: scaffold Expo app

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.2 — Configure ESLint + Prettier + jsx-a11y

**Files:**
- Create: `.eslintrc.cjs`, `.prettierrc`, `.prettierignore`
- Modify: `package.json` (add scripts + devDeps)

**Step 1 — Install**

```bash
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-native \
  eslint-plugin-jsx-a11y prettier eslint-config-prettier eslint-plugin-prettier
```

**Step 2 — `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native', 'jsx-a11y', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
  ],
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'web-build/'],
};
```

**Step 3 — `.prettierrc`**

```json
{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 100 }
```

**Step 4 — Add scripts to `package.json`**

```json
"scripts": {
  "lint": "eslint . --ext .ts,.tsx",
  "format": "prettier --write .",
  "typecheck": "tsc --noEmit"
}
```

**Step 5 — Run them**

```bash
pnpm lint && pnpm typecheck
```

Expected: both pass (the scaffold should be clean).

**Step 6 — Commit**

```bash
git add .
git commit -m "chore: add eslint (with jsx-a11y), prettier, typecheck

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.3 — Configure Vitest + React Native Testing Library

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`
- Modify: `package.json` (test script + devDeps)

**Step 1 — Install**

```bash
pnpm add -D vitest @testing-library/react-native @testing-library/jest-dom \
  @types/node jsdom
```

**Step 2 — `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'e2e', '.expo'],
  },
});
```

**Step 3 — `tests/setup.ts`**

```ts
import '@testing-library/jest-dom';
```

**Step 4 — Write a meta-test that fails first**

Create `tests/meta.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
describe('vitest', () => {
  it('runs', () => { expect(1 + 1).toBe(2); });
});
```

**Step 5 — Add script + run**

In `package.json`: `"test": "vitest run"`.

```bash
pnpm test
```

Expected: `1 passed`.

**Step 6 — Commit**

```bash
git add .
git commit -m "chore: add vitest + react-native testing library

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.4 — Add Zod and define the Operator schema (TDD)

**Files:**
- Create: `src/content/schemas.ts`, `src/content/schemas.test.ts`

**Step 1 — Install**

```bash
pnpm add zod
```

**Step 2 — Write the failing test**

`src/content/schemas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { OperatorEntry } from './schemas';

describe('OperatorEntry schema', () => {
  it('accepts a valid rail operator', () => {
    const sample = {
      id: 'avanti-west-coast',
      name: 'Avanti West Coast',
      mode: 'rail',
      assistance: { phone: '+44-3457-225225', bookingUrl: 'https://www.avantiwestcoast.co.uk/travelling-with-us/accessibility' },
      complaintsRoute: { primaryEmail: 'customer.resolutions@avantiwestcoast.co.uk', regulator: 'orr' },
      lastVerifiedUTC: '2026-05-21T00:00:00Z',
    };
    expect(() => OperatorEntry.parse(sample)).not.toThrow();
  });

  it('rejects an unknown mode', () => {
    const bad = { id: 'x', name: 'X', mode: 'teleport', assistance: { phone: '+44-1' }, complaintsRoute: { primaryEmail: 'a@b.c', regulator: 'orr' }, lastVerifiedUTC: '2026-05-21T00:00:00Z' };
    expect(() => OperatorEntry.parse(bad)).toThrow();
  });
});
```

**Step 3 — Run, see it fail**

```bash
pnpm test src/content/schemas.test.ts
```

Expected: FAIL — `Cannot find module './schemas'`.

**Step 4 — Implement**

`src/content/schemas.ts`:

```ts
import { z } from 'zod';

export const TransportMode = z.enum(['rail', 'air', 'bus', 'taxi', 'tfl']);
export const Regulator = z.enum(['orr', 'caa', 'ehrc', 'local', 'none']);

export const OperatorEntry = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  mode: TransportMode,
  assistance: z.object({
    phone: z.string().regex(/^\+?[0-9-]+$/),
    bookingUrl: z.string().url().optional(),
    accessibilityPageUrl: z.string().url().optional(),
  }),
  complaintsRoute: z.object({
    primaryEmail: z.string().email().optional(),
    primaryUrl: z.string().url().optional(),
    regulator: Regulator,
  }),
  lastVerifiedUTC: z.string().datetime(),
});

export type OperatorEntry = z.infer<typeof OperatorEntry>;
```

**Step 5 — Run, see it pass**

```bash
pnpm test src/content/schemas.test.ts
```

Expected: PASS (2 tests).

**Step 6 — Commit**

```bash
git add .
git commit -m "feat(content): add OperatorEntry schema with Zod

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.5 — Bundle the first operator (Avanti) + validate at load (TDD)

**Files:**
- Create: `src/content/operators/avanti-west-coast.json`, `src/content/operators/index.ts`, `src/content/operators/index.test.ts`

**Step 1 — Write the failing test**

`src/content/operators/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { loadBundledOperators } from './index';

describe('loadBundledOperators', () => {
  it('returns the bundled operators, all schema-valid', () => {
    const ops = loadBundledOperators();
    expect(ops.length).toBeGreaterThanOrEqual(1);
    expect(ops.find((o) => o.id === 'avanti-west-coast')).toBeDefined();
  });
});
```

**Step 2 — Run, see it fail**

```bash
pnpm test src/content/operators
```

Expected: FAIL — `Cannot find module './index'`.

**Step 3 — Add the JSON**

`src/content/operators/avanti-west-coast.json`:

```json
{
  "id": "avanti-west-coast",
  "name": "Avanti West Coast",
  "mode": "rail",
  "assistance": {
    "phone": "+44-3457-225225",
    "bookingUrl": "https://www.avantiwestcoast.co.uk/travelling-with-us/accessibility",
    "accessibilityPageUrl": "https://www.avantiwestcoast.co.uk/travelling-with-us/accessibility"
  },
  "complaintsRoute": {
    "primaryEmail": "customer.resolutions@avantiwestcoast.co.uk",
    "regulator": "orr"
  },
  "lastVerifiedUTC": "2026-05-21T00:00:00Z"
}
```

**Step 4 — Implement the loader**

`src/content/operators/index.ts`:

```ts
import { OperatorEntry } from '../schemas';
import avantiWestCoast from './avanti-west-coast.json';

const sources = [avantiWestCoast];

export function loadBundledOperators(): OperatorEntry[] {
  return sources.map((s) => OperatorEntry.parse(s));
}
```

**Step 5 — Run, see it pass**

```bash
pnpm test src/content/operators
```

Expected: PASS.

**Step 6 — Commit**

```bash
git add .
git commit -m "feat(content): bundle Avanti West Coast as first operator entry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.6 — Install Tamagui UI library

**Files:**
- Modify: `package.json`, `babel.config.js`, `app/_layout.tsx`
- Create: `tamagui.config.ts`

**Step 1 — Install**

```bash
pnpm add tamagui @tamagui/config @tamagui/babel-plugin
```

**Step 2 — `tamagui.config.ts`** (start with the default config; tune palette/typography later)

```ts
import { config } from '@tamagui/config/v3';
import { createTamagui } from 'tamagui';

const tamaguiConfig = createTamagui(config);
export type AppConfig = typeof tamaguiConfig;
declare module 'tamagui' { interface TamaguiCustomConfig extends AppConfig {} }
export default tamaguiConfig;
```

**Step 3 — Wrap the root layout**

`app/_layout.tsx`:

```tsx
import { TamaguiProvider } from 'tamagui';
import { Stack } from 'expo-router';
import config from '../tamagui.config';

export default function RootLayout() {
  return (
    <TamaguiProvider config={config}>
      <Stack screenOptions={{ headerShown: false }} />
    </TamaguiProvider>
  );
}
```

**Step 4 — Add the Babel plugin**

`babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@tamagui/babel-plugin', { components: ['tamagui'], config: './tamagui.config.ts' }],
    ],
  };
};
```

**Step 5 — Verify it still builds**

```bash
pnpm typecheck && pnpm start --web --non-interactive &
sleep 10 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081
kill %1
```

Expected: `200`.

**Step 6 — Commit**

```bash
git add .
git commit -m "chore: add tamagui ui library

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.7 — Build `BigActionButton` component (TDD)

**Files:**
- Create: `src/components/BigActionButton.tsx`, `src/components/BigActionButton.test.tsx`

**Step 1 — Failing test**

`src/components/BigActionButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { BigActionButton } from './BigActionButton';

describe('BigActionButton', () => {
  it('renders an accessible button with the given label', () => {
    render(<BigActionButton label="Plan a trip" onPress={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Plan a trip' });
    expect(btn).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = vi.fn();
    render(<BigActionButton label="Tap me" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Tap me' }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('exposes accessibilityHint when provided', () => {
    render(<BigActionButton label="Help" hint="Opens the directory" onPress={() => {}} />);
    expect(screen.getByRole('button').props.accessibilityHint).toBe('Opens the directory');
  });
});
```

**Step 2 — Run, see it fail**

```bash
pnpm test src/components/BigActionButton
```

Expected: FAIL.

**Step 3 — Implement**

`src/components/BigActionButton.tsx`:

```tsx
import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  hint?: string;
  testID?: string;
}

export function BigActionButton({ label, onPress, hint, testID }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      testID={testID}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 14, backgroundColor: '#1f6feb', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85 },
  label: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
```

**Step 4 — Run, see it pass**

```bash
pnpm test src/components/BigActionButton
```

Expected: PASS (3 tests).

**Step 5 — Commit**

```bash
git add .
git commit -m "feat(ui): add BigActionButton with a11y label/hint and 56pt min height

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.8 — Home screen with three big-tap actions (TDD)

**Files:**
- Create: `app/index.tsx` (replace the scaffold), `app/index.test.tsx`

**Step 1 — Failing test**

`app/index.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from './index';

describe('HomeScreen', () => {
  it('renders three big-tap actions', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('button', { name: /plan a trip/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /i.?m travelling now/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /something went wrong/i })).toBeTruthy();
  });
});
```

**Step 2 — Implement**

`app/index.tsx`:

```tsx
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BigActionButton } from '../src/components/BigActionButton';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <Text style={styles.h1} accessibilityRole="header">AccessMate</Text>
      <View style={styles.actions}>
        <BigActionButton label="Plan a trip" hint="Browse operator contacts" onPress={() => router.push('/directory')} />
        <BigActionButton label="I'm travelling now" hint="Coming soon" onPress={() => {}} />
        <BigActionButton label="Something went wrong" hint="Coming soon" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, paddingTop: 80, gap: 28, backgroundColor: '#fff' },
  h1: { fontSize: 32, fontWeight: '700' },
  actions: { gap: 16 },
});
```

**Step 3 — Run**

```bash
pnpm test app/index
```

Expected: PASS.

**Step 4 — Commit**

```bash
git add .
git commit -m "feat(home): add Home screen with three big-tap actions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.9 — Directory list screen (TDD)

**Files:**
- Create: `app/directory/index.tsx`, `app/directory/index.test.tsx`

**Step 1 — Failing test**

`app/directory/index.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import DirectoryScreen from './index';

describe('DirectoryScreen', () => {
  it('lists bundled operators', () => {
    render(<DirectoryScreen />);
    expect(screen.getByText('Avanti West Coast')).toBeTruthy();
  });
});
```

**Step 2 — Implement**

`app/directory/index.tsx`:

```tsx
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { loadBundledOperators } from '../../src/content/operators';

export default function DirectoryScreen() {
  const router = useRouter();
  const operators = loadBundledOperators();
  return (
    <FlatList
      data={operators}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/directory/${item.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.mode}`}
          style={styles.row}
        >
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.mode}>{item.mode.toUpperCase()}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, gap: 12 },
  row: { paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e1e4e8', backgroundColor: '#fff' },
  name: { fontSize: 18, fontWeight: '600' },
  mode: { marginTop: 4, fontSize: 12, color: '#57606a', letterSpacing: 1 },
});
```

**Step 3 — Run + commit**

```bash
pnpm test app/directory
git add .
git commit -m "feat(directory): add Directory list screen reading bundled operators

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.10 — Operator detail screen with tap-to-call (TDD)

**Files:**
- Create: `app/directory/[id].tsx`, `app/directory/[id].test.tsx`

**Step 1 — Failing test (mocks Linking)**

`app/directory/[id].test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import OperatorDetail from './[id]';

vi.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'avanti-west-coast' }) }));

describe('OperatorDetail', () => {
  beforeEach(() => { vi.spyOn(Linking, 'openURL').mockResolvedValue(true); });

  it('renders the operator name', () => {
    render(<OperatorDetail />);
    expect(screen.getByText('Avanti West Coast')).toBeTruthy();
  });

  it('opens a tel: URL when assistance call is tapped', () => {
    render(<OperatorDetail />);
    fireEvent.press(screen.getByRole('button', { name: /call passenger assistance/i }));
    expect(Linking.openURL).toHaveBeenCalledWith('tel:+44-3457-225225');
  });
});
```

**Step 2 — Implement**

`app/directory/[id].tsx`:

```tsx
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BigActionButton } from '../../src/components/BigActionButton';
import { loadBundledOperators } from '../../src/content/operators';

export default function OperatorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const operator = loadBundledOperators().find((o) => o.id === id);
  if (!operator) return <Text style={styles.padded}>Operator not found.</Text>;

  return (
    <View style={styles.root}>
      <Text style={styles.h1} accessibilityRole="header">{operator.name}</Text>
      <Text style={styles.mode}>{operator.mode.toUpperCase()}</Text>
      <BigActionButton
        label="Call Passenger Assistance"
        hint={operator.assistance.phone}
        onPress={() => Linking.openURL(`tel:${operator.assistance.phone}`)}
      />
      {operator.complaintsRoute.primaryEmail && (
        <BigActionButton
          label="Email complaints team"
          hint={operator.complaintsRoute.primaryEmail}
          onPress={() => Linking.openURL(`mailto:${operator.complaintsRoute.primaryEmail}`)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, paddingTop: 60, gap: 20, backgroundColor: '#fff' },
  padded: { padding: 24 },
  h1: { fontSize: 28, fontWeight: '700' },
  mode: { fontSize: 12, color: '#57606a', letterSpacing: 1 },
});
```

**Step 3 — Run + commit**

```bash
pnpm test app/directory
git add .
git commit -m "feat(directory): add operator detail with tap-to-call and tap-to-email

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.11 — Add Playwright + axe-core for web a11y CI

**Files:**
- Create: `e2e/web/playwright.config.ts`, `e2e/web/smoke.spec.ts`

**Step 1 — Install**

```bash
pnpm add -D @playwright/test @axe-core/playwright
pnpm dlx playwright install chromium
```

**Step 2 — `e2e/web/playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  webServer: {
    command: 'pnpm start --web --non-interactive',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:8081' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

**Step 3 — `e2e/web/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home screen loads and passes axe', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AccessMate' })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('navigating to directory shows Avanti', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /plan a trip/i }).click();
  await expect(page.getByText('Avanti West Coast')).toBeVisible();
});
```

**Step 4 — Add script**

```json
"test:e2e": "playwright test --config=e2e/web/playwright.config.ts"
```

**Step 5 — Run**

```bash
pnpm test:e2e
```

Expected: 2 passed.

**Step 6 — Commit**

```bash
git add .
git commit -m "test: add playwright + axe-core web e2e smoke

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.12 — iOS sim smoke test (manual gate)

Not a test that runs in CI; a manual gate before tagging.

**Step 1**

```bash
pnpm ios
```

Expected: iOS Simulator opens with the app.

**Step 2 — Manual checklist (write results into the commit message)**

- [ ] Home renders with three buttons.
- [ ] VoiceOver (Cmd+F5 in Simulator) reads each button label correctly.
- [ ] Tap "Plan a trip" → Directory list shows Avanti.
- [ ] Tap Avanti → detail screen shows.
- [ ] Tap "Call Passenger Assistance" → iOS shows the call confirmation sheet with `+44 3457 225225`.

**Step 3 — Commit the smoke note**

If everything passed, no code change. Just a note:

```bash
git commit --allow-empty -m "chore: ios sim smoke test passed (manual)

- Home renders three buttons
- VoiceOver reads labels correctly
- Directory shows Avanti
- Detail tap-to-call opens iOS call sheet

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.13 — Tag v0.1.0

```bash
git tag -a v0.1.0 -m "v0.1.0 — Phase 1 thin slice: Directory with Avanti, full a11y CI"
git push --tags origin main
```

Expected: tag visible at https://github.com/camilopires/AccessMate/releases.

---

**End of Phase 1.** At this point you have: working Expo app on iOS sim + web, type-safe content schema, one real operator, BigActionButton with a11y tests, axe-clean web home/directory, Playwright + Vitest pipelines green, tagged release.

---

# Phase 2 — Accessibility Passport

**Goal:** A structured profile users can edit, view as a "passport" screen, and export as a printable PDF. All local, no network.

**Tasks (to expand with `writing-plans` when Phase 1 is done):**

1. Define `Profile` Zod schema (chair specs with IATA battery fields, comms needs, sensory needs, meds, equipment, emergency contacts, blue badge).
2. Set up `expo-sqlite` + migrations runner; first migration creates `profile` and `schema_version` tables.
3. `ProfileRepository` with TDD: get/upsert profile, returns null when empty.
4. Profile editor screens (one section per tab: Mobility / Sensory / Medical / Contacts / Notes) with `ProfileChip` reusable component.
5. "Show as Passport" read-only view: large type, high contrast, screen-reader optimised, one-screen-at-a-time pagination on mobile.
6. PDF export using `expo-print` (web: uses browser print; mobile: native print/share).
7. Smoke test: VoiceOver reads the passport top-to-bottom in a logical order.

**Acceptance:** A user can enter their profile, view it as a passport, and export a PDF. All data stays on device.

---

# Phase 3 — Incident capture

**Goal:** A one-tap "Something went wrong" flow that creates an Incident row and lets the user attach photos, voice notes, GPS, and free-text under stress.

**Tasks:**

1. Add `expo-camera`, `expo-av` (audio), `expo-location`, `expo-file-system`.
2. Migration: `incidents`, `media_refs`, `trips` tables.
3. `IncidentRepository` (TDD): `start()` creates a row before any capture begins; `attachMedia()` adds a file ref.
4. `IncidentCaptureScreen` with one-handed layout: big record button, photo button, type/dictate field.
5. First-use mic explainer (lawful recording, stays on device).
6. Permission degradation tests: photo without camera permission → library import; GPS denied → manual station entry.
7. Crash-recovery flow: on launch, detect incidents in `status='in_progress'` and offer to resume.
8. Maestro (mobile E2E) added in this phase: golden path script for incident capture.

**Acceptance:** User can complete an incident capture with all four kinds of evidence in <60 seconds.

---

# Phase 4 — Complaint composer (template-only, no AI yet)

**Goal:** Turn an incident into a complete drafted complaint using scenario templates and the user's profile. No AI in this phase — proves the template engine is good enough on its own.

**Tasks:**

1. Define `ComplaintTemplate` schema: header, facts placeholder, profile-context placeholder, legal paragraph (fixed citations), narrative placeholder, ask.
2. Author 10 v1 templates: Missed Passenger Assist, Damaged mobility equipment, Refused boarding (rail), Refused boarding (air), Inaccessible station/airport facility, Discriminatory treatment, No audio announcements, BSL/communication failure, Taxi refusal, TfL-specific complaint.
3. Template assembly engine (TDD): given `(Incident, Profile, templateId)` → markdown draft.
4. ComplaintComposerScreen: scenario picker → assembled draft → editor.
5. "What gets sent" preview (in this phase: just shows the final markdown).
6. Output: mailto (PDF attached), copy to clipboard, PDF export.

**Acceptance:** All 10 scenarios produce a complete, send-ready complaint draft without AI.

---

# Phase 5 — Complaint tracker + 8-week reminder

**Goal:** Users track filed complaints and get reminded when it's time to escalate.

**Tasks:**

1. Migration: `complaints` table with status enum and audit timestamps.
2. ComplaintTracker list screen with status badges.
3. Status transitions: Sent → Acknowledged → Resolved | Escalated. Manual updates.
4. Local notification at sent+8 weeks: "Time to escalate to ORR / CAA / EHRC?" (uses `expo-notifications`).
5. Response capture: paste the operator's reply, attach as evidence.
6. Escalation flow stub: pre-fills regulator email/web (links from Directory).

**Acceptance:** A complaint can be filed, marked as sent, acknowledged, and escalated, with the right regulator surfaced automatically.

---

# Phase 6 — Share composer

**Goal:** From an incident or complaint, produce a redacted, accessible, platform-sized shareable post the user publishes on their own social account.

**Tasks:**

1. Redaction engine (TDD): mask staff names (regex + a small NER if on-device available); option to mask precise location/time; toggle for naming the operator.
2. Per-platform sizer: X (280), Bluesky (300), Threads (500), Instagram (square image + caption).
3. Image card generator using `react-native-view-shot` + a templated React component (logo, operator badge, redacted summary, AccessMate footer). Includes alt text.
4. ShareComposerScreen: shows the post, "What gets shared" preview, "Open in X / Bluesky / Threads / IG" buttons via deep links.
5. Hashtag suggester (curated set).

**Acceptance:** A user can go from a complaint to a posted, redacted, on-platform message in <2 minutes.

---

# Phase 7 — Settings (sync, AI prefs, accessibility, data control)

**Tasks:**

1. Sync: AES-256 zip export of SQLite + media, written via `expo-document-picker`. Passphrase-derived key (Argon2id via `react-native-quick-crypto`).
2. Sync import: validate before restoring; atomic; clear errors.
3. AI provider toggle (will gate Phase 9–10 features): On-device only / On-device + cloud / Off.
4. Accessibility prefs beyond OS: app-level font scale, high-contrast theme, reduce motion override.
5. Data export (JSON) and wipe device data (with double-confirm).
6. About / legal / disclaimer / open-source licences.

**Acceptance:** A user can move their data between two devices using only the file picker and a passphrase, and can wipe everything in two confirmed taps.

---

# Phase 8 — Onboarding wizard

**Tasks:**

1. 5-question wizard: primary access need, mobility aid (if any), communication preferences, who to contact in an emergency, notifications opt-in.
2. Skippable on every step; deferrable to "set up later."
3. Saves into Profile via ProfileRepository.
4. First-run detection.

**Acceptance:** A first-time user can complete onboarding in <90 seconds or skip it entirely without losing app function.

---

# Phase 9 — Cloud AI proxy (Cloudflare Worker → Claude)

**Goal:** A tiny, auditable cloud proxy that lets the app produce a polished complaint narrative when on-device AI is unavailable.

**Tasks:**

1. Stand up a Cloudflare Worker repo (separate from app or `apps/worker/` if we monorepo).
2. Hono router with single POST endpoint: `/polish`.
3. Request schema (Zod): `{ scenarioId, narrativeText, profileExcerpt }`. Reject anything else.
4. PII redaction pass: mask names not authored by the user (best-effort; the canonical mask happens client-side in Phase 6's engine — this is defence in depth).
5. Anthropic call (Claude Haiku 4.5 default) with a system prompt that forbids legal citations and constrains output to the narrative region.
6. Output validators: regex-scan for rogue citations; length cap; reject if structure broken.
7. Rate limit (Cloudflare KV): anonymous per-IP, generous-but-bounded.
8. App-side adapter `polishViaCloud()` that the AI strategy chain calls.
9. "What gets sent" preview now wired to the actual outbound payload (byte-identical assertion test in Phase 9).

**Acceptance:** A complaint draft can be polished via cloud, with the preview matching the wire payload exactly, and bad outputs being rejected.

---

# Phase 10 — On-device AI adapters

**Goal:** Replace cloud with on-device for capable devices. Apple FM (iOS) and Gemini Nano via AICore (Android).

**Tasks:**

1. **Apple Foundation Models module**: create an Expo config plugin + Swift native module that calls the FM API. Detect availability (Apple Intelligence enabled, capable device).
2. Adapter `polishViaAppleFM()` calling into the native module.
3. **Gemini Nano via AICore module**: Expo config plugin + Kotlin native module using `com.google.ai.edge.aicore`. Detect AICore availability.
4. Adapter `polishViaGeminiNano()` calling into the native module.
5. Update `aiPolish()` strategy to try them in order, fall back to cloud, fall back to template.
6. Provider chip UI: shows which provider produced the polish.
7. Cross-provider golden-set tests (Phase 1's testing harness extended): each provider polishes the same 30-incident set; scored on conformance/fidelity/tone/readability.

**Acceptance:** On a supported iPhone, polish runs fully on-device with the network off and produces conformant output.

---

# Phase 11 — OTA content + authoring workflow

**Goal:** Update operators and complaint templates without app-store review.

**Tasks:**

1. Bundle versioning: every content bundle has `schemaVersion`, `contentVersion`.
2. Expo Updates configured with content-only update channel.
3. Client-side validator: refuse to apply a bundle that fails Zod schema validation.
4. Rollback UI in Settings: "Revert to previous content version."
5. Content authoring repo or directory with a CI check (schema + URL liveness check via HEAD requests).
6. Documentation in `docs/content-authoring.md`: how to add an operator, how to add a template, who can publish.
7. Expand directory to ~20 operators (Avanti, LNER, GWR, ScotRail, TPE, Northern, EasyJet, BA, Ryanair, Wizz, TfL, Citymapper-style local, Bus Users UK, etc.).

**Acceptance:** A new operator can be added and published to all devices within hours, with bad pushes blocked by schema validation.

---

# Phase 12 — a11y audit, community user testing, public beta

**Tasks:**

1. Commission an external a11y audit (recommended: AbilityNet or a Deque-style consultancy).
2. Recruit 5+ paid disabled testers via Transport for All / Disability Rights UK / RNIB / RNID / Scope. Run moderated sessions per the script in `docs/qa/a11y-scripts.md`.
3. Address findings under a dedicated a11y-bugs label; release-gate the beta on zero blocker-severity issues.
4. TestFlight (iOS) + Play closed testing (Android) + Vercel/Cloudflare-hosted web.
5. Privacy policy, terms, disclaimer, contact route for users to report issues.
6. Launch announcement to community partners.

**Acceptance:** Public beta v1.0 ships; users from the testing cohort report it covers their core travel scenarios.

---

## Working principles for every phase

- **TDD strictly within a phase**: write the failing test, run it red, implement, run it green, commit. Use `superpowers:test-driven-development`.
- **Frequent commits**: per task, sometimes per step. Use `superpowers:executing-plans`'s commit cadence.
- **A11y is a release gate, not a polish phase**: axe-clean on web, manual SR scripts on native, every phase.
- **YAGNI ruthlessly**: anything in the design that's outside this v1 list (booking integrations, in-app social feed, multi-language, companion accounts) stays out.
- **Privacy by default**: nothing leaves the device without an explicit preview and user action.
- **When stuck on a non-trivial bug, use `superpowers:systematic-debugging` before guessing.**

---

## Next: execution mode

After this plan is committed, the writing-plans skill offers two execution paths:
1. **Subagent-driven (this session)** — fresh subagent per task, review between tasks. Stays here.
2. **Parallel session** — open a new session that loads `superpowers:executing-plans` and runs through the plan with checkpoints.
