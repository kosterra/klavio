import { loadConfig } from './config.js';
import { connectDb, disconnectDb } from './db.js';
import { buildApp } from './app.js';

const config = loadConfig();
await connectDb(config.MONGO_URL);
const app = await buildApp({ config });

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down`);
  await app.close();
  await disconnectDb();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ host: config.HOST, port: config.PORT });
