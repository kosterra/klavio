import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

// ---------------------------------------------------------------------------
// User (account owner; a parent may own several child profiles)
// ---------------------------------------------------------------------------
const userSchema = new Schema(
  {
    displayName: { type: String, required: true },
    /** Random opaque WebAuthn user handle (base64url) — never the Mongo id or PII. */
    webauthnUserId: { type: String, required: true, unique: true },
    /** Optional, only set after the address was verified with a code. */
    email: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    recoveryCodeHashes: { type: [String], default: [], index: true },
    parentPinHash: { type: String, default: null },
    locale: { type: String, default: 'de-CH' },
  },
  { timestamps: true },
);
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const User = model('User', userSchema);

// ---------------------------------------------------------------------------
// Passkey (WebAuthn credential)
// ---------------------------------------------------------------------------
const passkeySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    credentialId: { type: String, required: true, unique: true },
    publicKey: { type: Buffer, required: true },
    counter: { type: Number, required: true, default: 0 },
    transports: { type: [String], default: [] },
    deviceType: { type: String, default: 'singleDevice' },
    backedUp: { type: Boolean, default: false },
    name: { type: String, required: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
export type PasskeyDoc = InferSchemaType<typeof passkeySchema> & { _id: Types.ObjectId };
export const Passkey = model('Passkey', passkeySchema);

// ---------------------------------------------------------------------------
// Session (only the SHA-256 of the cookie token is stored)
// ---------------------------------------------------------------------------
const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activeProfileId: { type: Schema.Types.ObjectId, ref: 'Profile', default: null },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true },
);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const Session = model('Session', sessionSchema);

// ---------------------------------------------------------------------------
// Profile (learner; own progress + own microphone calibration)
// ---------------------------------------------------------------------------
const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    avatar: { type: String, default: 'fox' },
    uiMode: { type: String, enum: ['kids', 'classic'], default: 'kids' },
    dailyGoalMinutes: { type: Number, default: 10 },
    calibration: {
      a4Hz: { type: Number, default: 440 },
      noiseFloorDb: { type: Number, default: null },
      inputGain: { type: Number, default: 1 },
    },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: String, default: null }, // YYYY-MM-DD in the learner's local time
    },
    badges: { type: [{ id: String, earnedAt: Date, _id: false }], default: [] },
  },
  { timestamps: true },
);
export type ProfileDoc = InferSchemaType<typeof profileSchema> & { _id: Types.ObjectId };
export const Profile = model('Profile', profileSchema);

// ---------------------------------------------------------------------------
// Short-lived WebAuthn challenge, referenced by an httpOnly cookie
// ---------------------------------------------------------------------------
const authChallengeSchema = new Schema({
  /** SHA-256 of the random token stored in the challenge cookie. */
  tokenHash: { type: String, required: true, unique: true },
  challenge: { type: String, required: true },
  purpose: { type: String, enum: ['register', 'login', 'add-passkey'], required: true },
  /** register: the pending account data; add-passkey: the logged-in user. */
  userId: { type: Schema.Types.ObjectId, default: null },
  webauthnUserId: { type: String, default: null },
  displayName: { type: String, default: null },
  expiresAt: { type: Date, required: true },
});
authChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AuthChallenge = model('AuthChallenge', authChallengeSchema);

// ---------------------------------------------------------------------------
// One-time e-mail code (login / sign-up / verify address)
// ---------------------------------------------------------------------------
const emailCodeSchema = new Schema({
  email: { type: String, required: true, index: true },
  purpose: { type: String, enum: ['login', 'verify-email'], required: true },
  /** verify-email: the account the address will be attached to. */
  userId: { type: Schema.Types.ObjectId, default: null },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
emailCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const EmailCode = model('EmailCode', emailCodeSchema);

// ---------------------------------------------------------------------------
// Global settings (singleton document, editable by admins)
// ---------------------------------------------------------------------------
const appSettingsSchema = new Schema(
  {
    _id: { type: String, default: 'global' },
    emailLoginEnabled: { type: Boolean, required: true },
  },
  { timestamps: true },
);
export const AppSettings = model('AppSettings', appSettingsSchema);
