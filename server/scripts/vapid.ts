import { generateVapidKeys } from '../src/lib/webPush.js';

// A key pair for practice reminders (Web Push). Put both lines into .env and
// keep the private key secret; a new pair makes all reminders set up so far stop.
const { publicKey, privateKey } = generateVapidKeys();
console.log(`VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}`);
