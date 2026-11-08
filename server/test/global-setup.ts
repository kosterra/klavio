import { MongoBinary } from 'mongodb-memory-server';

/**
 * Fetches the MongoDB binary once, before the test files start in parallel:
 * on a fresh machine (CI) each file would otherwise download it at the same
 * time and trip over the download's lock file.
 */
export default async function globalSetup() {
  await MongoBinary.getPath();
}
