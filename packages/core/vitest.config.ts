import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// The unit tests are written against the small hand-authored seed network
// (data/seed/networks); the real SeaRoute network is covered by real-network.test.ts.
export default defineConfig({
  test: {
    env: { SHIPROUTESX_DATA_DIR: fileURLToPath(new URL('../../data/seed', import.meta.url)) },
  },
});
