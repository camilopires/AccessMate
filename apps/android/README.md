# AccessMate — Android

A native Kotlin + Jetpack Compose app. Material 3 theming, DataStore persistence, no React Native.

## Build

```bash
cd apps/android
./gradlew :app:assembleDebug
# or open in Android Studio (Hedgehog 2023.1.1+) and Run.
```

Requirements:

- JDK 17+
- Android SDK 34+ installed (compileSdk 34, targetSdk 34, minSdk 26)

## Data

- `app/src/main/assets/operators/*.json` — 20 bundled UK rail operators, copied from `packages/shared/operators/` at scaffold time.
- `app/src/main/assets/scenarios/*.json` — bundled scenario templates.
- Profile + incidents + settings persist via `DataStore<Preferences>` with JSON-encoded blobs (small payloads). A Room migration is on the roadmap.

Re-copy from shared when it changes:

```bash
cp ../../packages/shared/operators/*.json app/src/main/assets/operators/
cp ../../packages/shared/scenarios/*.json app/src/main/assets/scenarios/
```

## Tests

```bash
./gradlew :app:testDebugUnitTest
```
