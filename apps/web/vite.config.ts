import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3040,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
