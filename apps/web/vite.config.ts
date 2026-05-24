import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@accessmate/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@accessmate/shared/operators': path.resolve(__dirname, '../../packages/shared/operators'),
      '@accessmate/shared/scenarios': path.resolve(__dirname, '../../packages/shared/scenarios'),
    },
  },
  server: { port: 5173 },
});
