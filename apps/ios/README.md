# AccessMate — iOS

A native SwiftUI app. Single Xcode target, no React Native, no Cocoapods.

## Build

```bash
# One-time
brew install xcodegen

# Generate the Xcode project
cd apps/ios
xcodegen generate

# Open in Xcode and run
open AccessMate.xcodeproj
```

## Deployment target

iOS 17.0 minimum (uses SwiftData + `.containerBackground` + segmented `Picker`). On iOS 26+ the bottom tab bar and section cards adopt the SwiftUI `.glassEffect()` modifier automatically — that path is gated by `#available(iOS 26, *)`.

## Data

- `AccessMate/Resources/operators/*.json` — 20 bundled UK rail operators. These are copied from `packages/shared/operators/` at scaffold time. Re-copy when the shared package changes:
  ```bash
  cp ../../packages/shared/operators/*.json AccessMate/Resources/operators/
  cp ../../packages/shared/scenarios/*.json AccessMate/Resources/scenarios/
  ```
- Profile + incidents + settings persist via `UserDefaults` (small payloads, JSON-encoded). A SwiftData migration is on the roadmap.

## Tests

```bash
# From Xcode: Cmd-U
# Or via xcodebuild:
xcodebuild -scheme AccessMate -destination 'platform=iOS Simulator,name=iPhone 16' test
```
