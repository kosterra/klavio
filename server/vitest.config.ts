import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 120_000,
    globalSetup: ['./test/global-setup.ts'],
    // the tests run against the MongoDB version of docker-compose.yml
    env: { MONGOMS_VERSION: '9.0.4' },
  },
});
