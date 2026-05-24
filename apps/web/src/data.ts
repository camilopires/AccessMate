import type { OperatorEntry, ScenarioTemplate } from '@accessmate/shared';

// Eagerly import all 20 operators + 10 scenario templates so the bundle
// embeds the JSON at build time. Vite's `import.meta.glob` with `eager`
// gives us a typed map keyed by filename.

// Vite's import.meta.glob doesn't resolve TS aliases — use a relative
// path. The actual files live in packages/shared/{operators,scenarios}.
const operatorModules = import.meta.glob<{ default: OperatorEntry }>(
  '../../../packages/shared/operators/*.json',
  { eager: true },
);
const scenarioModules = import.meta.glob<{ default: ScenarioTemplate }>(
  '../../../packages/shared/scenarios/*.json',
  { eager: true },
);

export const OPERATORS: OperatorEntry[] = Object.values(operatorModules)
  .map((m) => m.default)
  .sort((a, b) => a.name.localeCompare(b.name));

export const SCENARIOS: ScenarioTemplate[] = Object.values(scenarioModules)
  .map((m) => m.default)
  .sort((a, b) => a.title.localeCompare(b.title));
