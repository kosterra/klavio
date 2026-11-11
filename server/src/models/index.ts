import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

// ---------------------------------------------------------------------------
// User (account owner; a parent may own several child profiles)
// ---------------------------------------------------------------------------
const userSchema = new Schema(
  {
    displayName: { type: String, required: true },
    /** Random opaque WebAuthn user handle (base64url) — never the Mongo id or PII. */
    webauthnUserId: { type: String, required: true, unique: true },
    /** Verified with a one-time code at sign-up; the account's fallback login. */
    email: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    /** HMAC of the optional parent PIN (protects the parent area from children). */
    parentPinHash: { type: String, default: null },
    /** the parent area may also be opened with one of the account's passkeys */
    parentPasskeyUnlock: { type: Boolean, default: false },
    /** weekly report by e-mail (opt-in) and the week (its Monday) last sent */
    weeklyReport: { type: Boolean, default: false },
    weeklyReportWeek: { type: String, default: null },
    locale: { type: String, default: 'de-CH' },
    /** last day the account was used (for deleting long-inactive accounts, if admins set it) */
    lastActiveAt: { type: Date, default: null },
    /** when the warning before deletion went out; cleared when the account is used again */
    inactiveWarnedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
// Partial: accounts from before e-mail sign-up became mandatory may still lack an address.
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
    /** Parent area (PIN-protected) open until then; set by entering the PIN (or resetting it by e-mail). */
    parentUnlockedUntil: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
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
    avatar: { type: String, default: 'klavi' },
    uiMode: { type: String, enum: ['kids', 'classic'], default: 'kids' },
    /** only the year, to offer the right worlds; null for profiles from before it was asked */
    birthYear: { type: Number, default: null },
    /** chosen worlds (kids | journey); null = follows uiMode */
    world: { type: String, enum: ['kids', 'journey', null], default: null },
    /** the wardrobe piece the figure wears (unlocked by level) */
    outfit: { type: String, default: null },
    dailyGoalMinutes: { type: Number, default: 10 },
    /** false for a new profile until the start-up questions are done; missing = done */
    setupDone: { type: Boolean },
    /** why the learner plays (read, songs, relax, fun, child) */
    motive: { type: String, default: null },
    /** planned practice days per week */
    weeklyGoalDays: { type: Number, default: null },
    /** where the learner plays first: the real piano or the screen keys */
    playOn: { type: String, enum: ['piano', 'screen', null], default: null },
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
      freeDayWeek: { type: String, default: null }, // the week whose free day was used
    },
    badges: { type: [{ id: String, earnedAt: Date, _id: false }], default: [] },
    // the learner's goal song: only its title, a style and the skills it needs
    goalSong: {
      type: new Schema(
        { title: String, style: String, skills: { type: [String], default: [] } },
        { _id: false },
      ),
      default: null,
    },
  },
  { timestamps: true },
);
export type ProfileDoc = InferSchemaType<typeof profileSchema> & { _id: Types.ObjectId };
export const Profile = model('Profile', profileSchema);

// ---------------------------------------------------------------------------
// Lesson progress per profile (best result; individual attempts are not kept)
// ---------------------------------------------------------------------------
const lessonProgressSchema = new Schema(
  {
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    lessonId: { type: String, required: true },
    bestStars: { type: Number, required: true },
    completions: { type: Number, default: 0 },
    lastCompletedAt: { type: Date, default: null },
    // repetition (see shared/curriculum/review.ts): local date of the last
    // completion, step in the schedule, reviews done while due
    lastLocalDate: { type: String, default: null },
    reviewBox: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    /** passed by placement («I can already do this»), not played */
    placed: { type: Boolean, default: false },
  },
  { timestamps: true },
);
lessonProgressSchema.index({ profileId: 1, lessonId: 1 }, { unique: true });
export const LessonProgress = model('LessonProgress', lessonProgressSchema);

// ---------------------------------------------------------------------------
// Practice time and XP per profile and local calendar day (daily goal)
// ---------------------------------------------------------------------------
const dailyActivitySchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD, learner's local date
  seconds: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
});
dailyActivitySchema.index({ profileId: 1, date: 1 }, { unique: true });
export const DailyActivity = model('DailyActivity', dailyActivitySchema);

// ---------------------------------------------------------------------------
// Short-lived WebAuthn challenge, referenced by an httpOnly cookie
// ---------------------------------------------------------------------------
const authChallengeSchema = new Schema({
  /** SHA-256 of the random token stored in the challenge cookie. */
  tokenHash: { type: String, required: true, unique: true },
  challenge: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'add-passkey', 'parent-unlock'], required: true },
  /** add-passkey: the logged-in user. */
  userId: { type: Schema.Types.ObjectId, default: null },
  expiresAt: { type: Date, required: true },
});
authChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AuthChallenge = model('AuthChallenge', authChallengeSchema);

// ---------------------------------------------------------------------------
// One-time e-mail code (login / sign-up / verify address)
// ---------------------------------------------------------------------------
const emailCodeSchema = new Schema({
  email: { type: String, required: true, index: true },
  purpose: { type: String, enum: ['login', 'verify-email', 'pin-reset'], required: true },
  /** verify-email: the account the address will be attached to; pin-reset: the account. */
  userId: { type: Schema.Types.ObjectId, default: null },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
emailCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const EmailCode = model('EmailCode', emailCodeSchema);

// ---------------------------------------------------------------------------
// Failed attempts (login codes per address, parent PIN per account) – kept in
// the database so a restart or a second instance doesn't reset them
// ---------------------------------------------------------------------------
const authThrottleSchema = new Schema({
  _id: { type: String, required: true }, // e.g. "code:anna@example.ch", "pin:<userId>"
  failures: { type: Number, default: 0 },
  lastFailureAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});
authThrottleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AuthThrottle = model('AuthThrottle', authThrottleSchema);

// ---------------------------------------------------------------------------
// Lesson receipt: a result the device sent (its own id) – sent again because
// the answer got lost, it is not counted twice. Kept a little longer than the
// device keeps unsent results.
// ---------------------------------------------------------------------------
const lessonReceiptSchema = new Schema({
  /** the result's id, chosen on the device */
  _id: { type: String },
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  /** the answer given the first time (null while it is being saved) */
  result: { type: Schema.Types.Mixed, default: null },
  expiresAt: { type: Date, required: true },
});
lessonReceiptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const LessonReceipt = model('LessonReceipt', lessonReceiptSchema);

// ---------------------------------------------------------------------------
// Global settings (singleton document, editable by admins)
// ---------------------------------------------------------------------------
const appSettingsSchema = new Schema(
  {
    _id: { type: String, default: 'global' },
    /** When false, no new accounts can be created; existing users can still log in. */
    registrationOpen: { type: Boolean, required: true },
    /** who runs this instance (footer, privacy page); empty until an admin fills it in */
    operatorName: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    /** from this age profiles can choose between the kids' worlds and the journey */
    journeyMinAge: { type: Number },
    /** false: robots noindex everywhere (a private family or school instance) */
    searchIndexing: { type: Boolean },
    /** accounts without any sign-in for this many months are deleted (0 = never) */
    inactiveDeleteMonths: { type: Number },
  },
  { timestamps: true },
);
export const AppSettings = model('AppSettings', appSettingsSchema);

// ---------------------------------------------------------------------------
// E-mail texts changed by admins (one document per mail; missing → built-in texts)
// ---------------------------------------------------------------------------
const mailTextSchema = new Schema(
  {
    subject: { type: String, required: true },
    heading: { type: String, required: true },
    intro: { type: String, default: '' },
    outro: { type: String, default: '' },
  },
  { _id: false },
);
const mailTemplateSchema = new Schema(
  {
    _id: { type: String, required: true },
    de: { type: mailTextSchema, required: true },
    en: { type: mailTextSchema, required: true },
  },
  { timestamps: true },
);
export const MailTemplate = model('MailTemplate', mailTemplateSchema);
