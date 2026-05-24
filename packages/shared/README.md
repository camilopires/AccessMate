# @accessmate/shared

Plain TypeScript types + data shared across the three native apps.

- `operators/*.json` — 20 UK rail operator entries (also embedded into iOS / Android bundles at build time)
- `scenarios/*.json` — complaint scenario templates (header, legal paragraph, ask)
- `src/index.ts` — TS types (OperatorEntry, ScenarioTemplate, IncidentFacts, Profile) + `assembleDraft()` so every platform produces the same output for the same inputs

This package has zero runtime dependencies. The web app imports it directly; the iOS and Android apps copy the JSON files into their bundles via a Gradle / Build Phase script.
