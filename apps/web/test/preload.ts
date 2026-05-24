import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Register once per Bun test process. happy-dom throws if you call
// register() twice; each test file that needs DOM lists this module via
// bunfig.toml's `preload`.
if (!(globalThis as { window?: unknown }).window) {
  GlobalRegistrator.register();
}
