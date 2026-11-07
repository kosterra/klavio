import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/scripts/grantAdmin.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // the shared workspace package ships TypeScript sources → bundle it in
  noExternal: ['@klavio/shared'],
});
