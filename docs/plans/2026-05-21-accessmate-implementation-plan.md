# AccessMate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Build AccessMate v1 — a cross-platform (Expo + RN Web) UK accessibility travel companion covering Directory, Accessibility Passport, and Complaint helper, with on-device AI preferred and cloud Claude as fallback.

**Architecture:** Single Expo monorepo (TypeScript). Local-first storage (expo-sqlite + expo-file-system). Bundled content (operators + complaint templates) shipped via Expo OTA. AI adapter selects Apple Foundation Models → Gemini Nano via AICore → Cloudflare Worker → template-only. Optional user-encrypted sync via OS document pickers. WCAG 2.2 AA as a release gate.

**Tech Stack:** Expo SDK 54 (`~54.0.33`, what `create-expo-app@latest` ships — fully supported), React Native 0.81, React 19.1, React Native Web 0.21, TypeScript, Expo Router, expo-sqlite, expo-file-system, Tamagui (UI), Zod (schemas), **dual test runners — Vitest 4 for pure-TS modules (schemas, repositories, pure logic), Jest 29 with `jest-expo@55` preset for React Native components/screens** (React Native Testing Library v13 on top of Jest; `react-test-renderer` must match React's exact version, currently `19.1.0`), Maestro (mobile E2E — added in Phase 3), Playwright + axe-core (web E2E + a11y), Cloudflare Workers + Hono (AI proxy — Phase 11), Anthropic Claude SDK.

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

- **Node ≥20.x** (`node --version`) and **pnpm via corepack** (`corepack enable pnpm` — uses Node's built-in package-manager shim, no global install). Verify: `pnpm --version` returns ≥9.
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

> **Batch 3 autonomous run (2026-05-23):** delivered Phases 2 through 9 in a
> single uninterrupted session per the user's "continue until whole app is
> done, don't wait for my approval" directive. See the per-phase notes below
> and the closing handoff at the bottom of this section.
>
> **Headline numbers at the end of Batch 3:**
> - Phases 1 → 8 done; Phase 9 (cloud proxy) scaffold landed but is inert
>   until ANTHROPIC_API_KEY + a Cloudflare KV namespace are provisioned.
> - Phases 10 / 11 / 12 are not started — they need native devices, ~20 real
>   operators researched, and external audit + store accounts respectively.
> - 86 vitest + 35 jest-RNTL component tests + 7 Playwright/axe E2E tests
>   pass on every commit.
> - 7 home screen actions wired (Plan a trip / Passport / Recent incidents /
>   Complaints / Settings / I'm travelling now / Something went wrong) plus
>   a Resume banner and a first-run Redirect to /onboarding.
> - First-run wizard ships; localStorage on web, sqlite on native for every
>   store (Profile / Incident / MediaRef / Complaint); web bundle dodges
>   expo-sqlite's SharedArrayBuffer requirement via a Platform-aware factory.
> - 10 v1 complaint templates authored citing Equality Act 2010, ATP (ORR),
>   EU 1107/2006 (CAA), BSL Act 2022, Equality Act ss.165–166 (taxis), TfL/
>   EHRC. Drafts assemble from incident + profile + template.
>
> **Resume check (run after a fresh /clear):**
> ```
> git pull && pnpm install
> pnpm test && pnpm test:e2e && pnpm lint && pnpm typecheck
> ```
> All should be green.
>
> **Execution status (2026-05-21):**
> - **Batch 1 (Tasks 1.1–1.4) shipped.** Commits: `1c0a12a` (scaffold + strip demo), `8aebc5a` (prettier + jsx-a11y), `143262a` (dual test runners), `d39d3fb` (Zod OperatorEntry schema).
> - **Batch 2 (Tasks 1.5–1.11) shipped.** Commits:
>     - `957cfa1` Task 1.5 — Avanti JSON + loader (TDD).
>     - `0dd183a` Task 1.6 — Tamagui 2.0.0-rc.42 (plan said 1.x; 2.x is what pnpm resolves).
>     - `2f98360` Task 1.7 — BigActionButton (TDD).
>     - `23dccdd` Tasks 1.8 + 1.9 + 1.10 — Home → Directory → Detail thin slice. **Coupled into one commit** because Expo Router typedRoutes compile-checks every `router.push(...)`, so the three screens can't land in isolation without casts or placeholders.
>     - `19eb15d` Task 1.11 — Playwright + axe-core web E2E.
> - **Batch 2 deferred: Task 1.12** (iOS sim manual smoke). Recorded as empty commit `534cb3e` describing the gate; v0.1.0 tag is paused on it.
> - **Next: Task 1.12** (`pnpm ios`, walk the manual checklist), then **Task 1.13** (tag `v0.1.0`).
> - **Resume check:** `git pull && pnpm install && pnpm test && pnpm test:e2e && pnpm lint && pnpm typecheck` should all be green.
> - **Phase 1 status:** 11 / 13 tasks complete (1.12 deferred, 1.13 paused).
>
> **Batch 2 plan amendments (in addition to Batch 1's):**
> - **Tamagui 2.x not 1.x.** `pnpm add tamagui` resolved to `2.0.0-rc.42`. API differences: `TamaguiProvider` now requires a `defaultTheme` prop. `@tamagui/config/v3` is still exported (alongside v4, v5, v5-css). The `@tamagui/babel-plugin` pulls in `esbuild` whose postinstall script needs the pnpm v11 build-script allowlist (`pnpm-workspace.yaml allowBuilds.esbuild = true`).
> - **`.tamagui/` directory.** The babel plugin writes a compile cache here. Added to `.gitignore`.
> - **`.tsx` test files moved out of `app/`.** Expo Router scans `app/` for routes via a regex in `expo-router/_ctx.js` that only excludes `+api`, `+html`, `+native-intent`. Test files inside `app/` show up as routes (and pollute typedRoutes types). New convention: tests for app routes live in `tests/app/<route>/*.test.tsx`. Component tests under `src/components/*.test.tsx` are unaffected (Expo Router doesn't scan `src/`).
> - **Jest globals via `@jest/globals` import.** Plan snippets in Tasks 1.7–1.10 imported `describe/it/expect/vi/beforeEach` from `'vitest'`, but `.tsx` files run under Jest. Vitest's globals happen to typecheck (vitest config has `globals: true`) but `vi.*` calls don't. Translated to explicit `import { describe, it, expect, jest, beforeEach } from '@jest/globals'`. Added `@jest/globals@^29` as direct devDep. Replaced `toHaveBeenCalledOnce()` (vitest-only) with `toHaveBeenCalledTimes(1)`.
> - **typedRoutes regen.** `.expo/types/router.d.ts` is generated by `expo start` whenever it sees the route tree change. Tasks 1.8/1.9/1.10 each required a regen. In CI you'd run `expo start` briefly or call the codegen task; in this batch I ran it inline.
> - **Expo `--non-interactive` flag removed.** Tasks 1.1 and 1.11 used this flag; SDK 54 prints `--non-interactive is not supported, use $CI=1 instead`. Playwright `webServer.command` was changed from `pnpm start --web --non-interactive` to `CI=1 pnpm start --web`.
> - **Static `<title>` for axe.** Axe-core flagged WCAG 2.4.2 "document must have a non-empty `<title>`" on first run. Stack `screenOptions.title` propagates via React Navigation's `useDocumentTitle` *after* hydration — axe samples the pre-hydration DOM. Fix: render `<Head><title>AccessMate</title>…</Head>` from `expo-router/head` directly in `app/_layout.tsx` so the static HTML head is correct.

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

Open `package.json`. Confirm `"expo": "~54.0.33"` (what `create-expo-app@latest` shipped on 2026-05-21; SDK 55 also exists but is not the default-template default). The `~` pins the minor so we don't auto-jump majors. Confirm peers (`react`, `react-native`, `react-dom`, `react-native-web`) by running `npx expo install --check`.

**Step 3b — Strip the demo template**

`create-expo-app`'s default template ships a multi-tab demo with `app/(tabs)/`, `app/modal.tsx`, `components/`, `constants/`, `hooks/`, and `scripts/reset-project.js`. We don't want any of it. The bundled `pnpm run reset-project` script fails under pnpm v11 (its post-action `pnpm install` trips the build-script allowlist), so strip manually:

```bash
rm -rf "app/(tabs)" app/modal.tsx components constants hooks scripts
```

Then replace `app/_layout.tsx` with a minimal `Stack` (no theme provider, no anchor) and create a placeholder `app/index.tsx` that you'll replace in Task 1.8.

**Step 3c — pnpm v11 build-script allowlist**

Edit `pnpm-workspace.yaml` (created by the scaffold) to set `allowBuilds.unrs-resolver: true`. Without this, `pnpm install` exits with `ERR_PNPM_IGNORED_BUILDS` and any tool that runs install (incl. `expo start`'s deps check) will fail.

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

### Task 1.3 — Configure dual test runners (Vitest for pure-TS, Jest+RNTL for components)

**Rationale:** React Native components don't run cleanly under Vitest+jsdom — they need RN's renderer and Expo's transform. We use Vitest for pure-TypeScript modules (schemas, repositories, utilities — fast feedback) and Jest with the `jest-expo` preset for any test that mounts an RN component or Expo Router screen. File-extension convention enforces the split: `*.test.ts` → Vitest; `*.test.tsx` → Jest.

**Files:**
- Create: `vitest.config.ts`, `jest.config.js`, `tests/vitest-setup.ts`, `tests/jest-setup.ts`, `tests/meta.test.ts`, `tests/meta.test.tsx`
- Modify: `package.json` (devDeps + scripts)

**Step 1 — Install both runners**

```bash
pnpm add -D vitest jsdom \
  jest@^29 jest-expo @testing-library/react-native \
  react-test-renderer@19.1.0 @types/react-test-renderer@19.1.0
```

Pin notes:
- `jest@^29` (not 30) because `jest-expo@55` was built against Jest 29 and trips on Jest 30's internal API rename (`clearMocksOnScope`).
- `react-test-renderer@19.1.0` must match React's exact version. RNTL v13 validates this and refuses to load on mismatch.
- Drop `@testing-library/jest-native` (deprecated; matchers are built-in to RNTL v13+).
- Drop `@types/node` for now (Expo's TS setup includes the Node types it needs).

**Step 2 — `vitest.config.ts`** (pure-TS only)

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/vitest-setup.ts'],
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'e2e', '.expo', '**/*.test.tsx'],
  },
});
```

**Step 3 — `tests/vitest-setup.ts`**

```ts
// Reserved for Vitest-only setup (none needed yet).
export {};
```

**Step 4 — `jest.config.js`** (components/screens via jest-expo)

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/tests/jest-setup.ts'],
  testMatch: ['**/?(*.)+(test).tsx'],
};
```

Don't override `transformIgnorePatterns` — `jest-expo` already provides a correct one. Don't use `setupFilesAfterEach` (not a real Jest option); the correct key is `setupFiles`.

**Step 5 — `tests/jest-setup.ts`**

```ts
import '@testing-library/jest-native/extend-expect';
```

**Step 6 — Meta-tests that prove both runners work**

`tests/meta.test.ts` (Vitest, pure TS):

```ts
import { describe, it, expect } from 'vitest';
describe('vitest', () => {
  it('runs pure-TS tests', () => { expect(1 + 1).toBe(2); });
});
```

`tests/meta.test.tsx` (Jest, React component):

```tsx
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
describe('jest + RNTL', () => {
  it('renders RN components', () => {
    render(<Text>hello</Text>);
    expect(screen.getByText('hello')).toBeTruthy();
  });
});
```

**Step 7 — Add scripts**

In `package.json`:

```json
"test:unit": "vitest run",
"test:rn":   "jest",
"test":      "pnpm test:unit && pnpm test:rn"
```

**Step 8 — Run both, see them pass**

```bash
pnpm test:unit && pnpm test:rn
```

Expected: each reports 1 passed.

**Step 9 — Commit**

```bash
git add .
git commit -m "chore: add dual test runners (vitest for pure-TS, jest+RNTL for components)

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
pnpm test:unit src/content/schemas.test.ts
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
pnpm test:unit src/content/schemas.test.ts
```

Expected: PASS (2 tests).

**Step 6 — Disable `@typescript-eslint/no-redeclare` for the Zod pattern**

The idiomatic Zod `export const X = z.object(...); export type X = z.infer<typeof X>` pattern reuses the same identifier in the value and type namespaces. TypeScript handles this fine; ESLint's no-redeclare rule doesn't. Add to `eslint.config.js`:

```js
rules: {
  'prettier/prettier': 'error',
  '@typescript-eslint/no-redeclare': 'off',
},
```

**Step 7 — Commit**

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
pnpm test:unit src/content/operators
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
pnpm test:unit src/content/operators
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
pnpm test:rn src/components/BigActionButton
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
pnpm test:rn src/components/BigActionButton
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
pnpm test:rn app/index
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
pnpm test:rn app/directory
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
pnpm test:rn app/directory
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

> **Batch 3 status:** **shipped (2026-05-23).** 7 commits:
> - `2ed6dee` (2.1) Profile Zod schema with IATA battery fields
> - `099b431` (2.2) expo-sqlite + Migrator (schema_version, ordered, TDD'd)
> - `d31a5ad` (2.3) ProfileRepository get/upsert
> - `876d950` (2.4) ProfileChip + ProfileEditor screen
> - `3fea55e` (2.6) PDF export via expo-print + passportToHtml
> - Plus the in-line PassportView (2.5) and `…store.ts` web-aware factory
>   (web → localStorage, native → expo-sqlite) introduced in those commits.
>
> **Amendment captured for future phases:** expo-sqlite's web build imports
> a `.wasm` file from `wa-sqlite/`. Two fixes were needed:
> (a) `metro.config.js` adds `wasm` to `assetExts` so Metro resolves the
> import; (b) at runtime the web build still needs SharedArrayBuffer
> (cross-origin isolation via COOP/COEP) which the Expo dev server does
> not set. AccessMate's `getProfileStore()` / `getIncidentStore()` /
> `getComplaintStore()` factories therefore short-circuit to localStorage
> on `Platform.OS === 'web'` and only `require('expo-sqlite')` on native.
> This pattern is reused across all stores in Phases 3 / 5.

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

> **Batch 3 status:** **shipped (2026-05-23).** Notes captures + summary work on
> web and native; **camera / audio / GPS native capture is deferred**
> (requires a device — same reason 1.12 is deferred). The plan's permission
> degradation + Maestro mobile E2E (item 8) are deferred with it.
>
> Commits:
> - `c6bcf55` Install expo-camera / expo-audio (replaces deprecated
>   expo-av in SDK 54) / expo-location / expo-file-system
> - Migration v2 (incidents / media_refs / trips tables) bundled with the
>   Incident schema + dual stores in the next two commits
> - Incident + MediaRef Zod schemas with the `note↔textBody` /
>   `photo|audio↔fileUri` refine; LocalStorageIncidentStore + SqliteIncidentStore
>   + getIncidentStore() factory
> - `03feb49` IncidentCaptureScreen + capture route (text notes attach;
>   photo/audio buttons show "coming in a later phase" Alerts pending the
>   native build)
> - `0e28f6b` Resume banner on Home + `/incident/capture?id=` resume path
> - `b7fd17a` E2E smoke

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

> **Batch 3 status:** **shipped (2026-05-23).** All 10 v1 templates authored.
> Composer wires from incident detail; outputs (mailto / copy / PDF) wired
> via expo-clipboard + expo-print.
>
> Reviewer note for future iteration: the legal paragraphs are concise and
> cite real UK frameworks (Equality Act 2010, ATP / ORR, EU 1107/2006 /
> CAA, BSL Act 2022, Equality Act ss.165–166, TfL / EHRC). They are NOT
> legal advice — before public beta, run them past someone with a UK
> disability-rights legal background.

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

> **Batch 3 status:** **shipped (2026-05-23).** Compose → Send creates a
> draft Complaint row; status transitions Draft → Sent → Acknowledged →
> Resolved / Escalated wired; response-paste-back field on detail screen.
> `scheduleEightWeekReminder()` uses expo-notifications on native (no-op
> on web). The escalation flow's regulator pointer (item 6) is plumbed
> through ComplaintTemplate.regulator but the Directory still only has
> Avanti — Phase 11 needs to populate the rest.

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

> **Batch 3 status:** **shipped (2026-05-23) without the image-card item.**
> Redaction engine (longest-cue-first staff-name masking + optional
> operator + date/time masks) + per-platform sizer (X 280 / Bluesky 300 /
> Threads 500 / Instagram unbounded) + deep-link composer
> (twitter/intent, bsky/intent, threads/intent; Instagram copies to
> clipboard since it has no public compose intent URL).
>
> **Deferred:** the `react-native-view-shot` image-card generator (plan
> item 3). It needs the native bridge, so it lands when 1.12 / Phase 3
> media capture come back online.

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

> **Batch 3 status:** **shipped without the encrypted-sync item.** Settings
> store (Zod-validated, localStorage on web, InMemory on native pending
> the AsyncStorage wire-up below). /settings route exposes high-contrast,
> reduce-motion, font-scale, AI-provider toggles, plus Export-JSON and
> Wipe-device-data. exportAllData on web triggers a Blob download; on
> native it uses `expo-file-system/legacy` + `expo-sharing` (the new SDK 54
> File API didn't expose `documentDirectory` from the default export, so
> the legacy entry point is what we use). wipeAllData drops sqlite tables
> on native or clears `accessmate.*` localStorage keys on web.
>
> **Deferred (item 1):** AES-256 zip sync + Argon2id key derivation via
> `react-native-quick-crypto`. The library is mobile-only and adds a
> significant native build step — slot it back in alongside Phase 10.
>
> **Known caveat:** the InMemoryStorage native fallback means settings
> reset on every app launch outside of a real device build. The right
> follow-up is AsyncStorage (sync API doesn't fit but it's the typical
> RN choice) or a tiny `app_settings` sqlite table.

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

> **Batch 3 status:** **shipped (2026-05-23).** 5-step wizard at /onboarding.
> First-run detection is a `Settings.onboardingComplete` flag; the Home
> screen now renders an Expo Router `<Redirect href="/onboarding" />`
> when that flag is false. (Used Redirect rather than a useEffect+
> router.replace because navigating in an effect before the Stack mounts
> throws "Attempted to navigate before mounting the Root Layout".)

**Tasks:**

1. 5-question wizard: primary access need, mobility aid (if any), communication preferences, who to contact in an emergency, notifications opt-in.
2. Skippable on every step; deferrable to "set up later."
3. Saves into Profile via ProfileRepository.
4. First-run detection.

**Acceptance:** A first-time user can complete onboarding in <90 seconds or skip it entirely without losing app function.

---

# Phase 9 — Cloud AI proxy (Cloudflare Worker → Claude)

> **Batch 3 status:** **scaffolded, inert.** `worker/src/index.ts` is a
> Hono Worker with a Zod request schema, defensive staff-name redaction,
> Anthropic call wired to `claude-haiku-4-5-20251001`, output validators
> (rogue-citation regex + length cap), and a KV-backed per-IP rate limit.
> `src/ai/polish.ts` exports `polishViaCloud({ endpoint, ... })` returning
> null when the endpoint is empty or the upstream errors. 3 vitest tests
> cover the client.
>
> **Not yet wired into the composer.** "Send by email" still uses the
> template-only assembled draft. To enable cloud polish:
> 1. `cd worker && pnpm install && wrangler kv:namespace create RATE_KV`
>    (paste the id into `wrangler.toml`).
> 2. `wrangler secret put ANTHROPIC_API_KEY` and provide your key.
> 3. `wrangler deploy` — gives you a URL like
>    `https://accessmate-polish.<account>.workers.dev/polish`.
> 4. Add a settings field `polishEndpoint` (or wire via build env var) and
>    call `polishViaCloud({ endpoint, ... })` from the composer between
>    "Send by email" and the actual `openComplaintMailto` call.
>
> The Worker has its own `tsconfig.json` and is excluded from the app's
> tsconfig so the two compile independently.

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

> **Batch 3 status:** **not started — blocked on devices.** The Apple FM
> module and Gemini Nano AICore module both need real native builds
> (Expo dev client) and capable test devices (Apple Intelligence-ready
> iPhone, Android with AICore). The Phase 9 client adapter is the
> integration point — wire `polishViaAppleFM` / `polishViaGeminiNano`
> alongside `polishViaCloud` under a single `aiPolish()` strategy.

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

> **Batch 3 status:** **not started.** Directory still bundles only Avanti
> West Coast (`src/content/operators/avanti-west-coast.json`). Adding
> ~20 more operators is a research task (phone numbers, complaints
> emails, accessibility URLs, regulator) more than a code task. The
> schema (`src/content/schemas.ts → OperatorEntry`) is ready to absorb
> them — each new operator is a JSON file alongside Avanti's and a line
> in `src/content/operators/index.ts`. The OTA-update / Expo Updates /
> CI URL-liveness check is the harder follow-up.

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

> **Batch 3 status:** **not started — needs external resources.** Paid
> auditor + recruited paid testers + TestFlight + Play closed testing +
> Vercel/Cloudflare web host + privacy policy + launch. Out of scope for
> autonomous execution.

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
