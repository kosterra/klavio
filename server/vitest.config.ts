import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // mongod < 8.0.35 refuses to start on Linux 7.x kernels (SERVER-131779)
    env: { GLIBC_TUNABLES: 'glibc.pthread.rseq=1' },
  },
});
