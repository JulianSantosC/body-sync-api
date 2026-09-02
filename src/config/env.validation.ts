import * as Joi from 'joi';

// Joi schema validates shape AND format of env vars at startup.
// The pattern for *_EXPIRES_IN enforces the same format the `ms` package
// expects at runtime (e.g. "15m", "7d"), so a typo here fails fast on boot
// instead of surfacing as a cryptic JWT error later.

// This is a regular expression (regex) literal, wrapped in slashes / /.
// Breaking it down:
//   ^          -> start of the string (nothing allowed before)
//   \d+        -> one or more digits (0-9)
//   (ms|s|m|h|d|w|y)  -> exactly one of these unit abbreviations:
//                        ms=milliseconds, s=seconds, m=minutes, h=hours,
//                        d=days, w=weeks, y=years
//   $          -> end of the string (nothing allowed after)
// So this regex matches strings like "15m", "7d", "500ms" — but rejects
// things like "15 m" (has a space) or "15minutes" (wrong unit spelling).
const expiresInPattern = /^\d+(ms|s|m|h|d|w|y)$/;

// `export` makes this constant importable from other files (e.g. app.module.ts).
// `Joi.object({...})` builds a schema describing the SHAPE of an object:
// which keys it must have, and what type/rules each key's value must follow.
// This schema will later be checked against `process.env` as a whole.
export const envValidationSchema = Joi.object({

  // NODE_ENV must be a string...
  NODE_ENV: Joi.string()
    // ...and its value must be ONE of exactly these three options.
    // If it's anything else (e.g. a typo like "productio"), validation fails.
    .valid('development', 'production', 'test')
    // If NODE_ENV isn't set at all in the environment, Joi will use this
    // default value instead of throwing an error. Useful because in local
    // dev you might not always export NODE_ENV manually.
    .default('development'),

  // DATABASE_URL must be a string, and `.required()` means the app will
  // refuse to start if this env var is missing entirely (no default here,
  // because there's no sensible default connection string to fall back to).
  DATABASE_URL: Joi.string().required(),

  // JWT_ACCESS_SECRET must be a string of at least 32 characters (`.min(32)`).
  // This isn't arbitrary: JWT signing secrets should be long/random enough
  // to resist brute-force guessing. `.required()` again means no default —
  // you MUST provide this in the .env file or the app won't boot.
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),

  // JWT_ACCESS_EXPIRES_IN must be a string that matches the regex pattern
  // defined above (`.pattern(expiresInPattern)`), e.g. "15m".
  // `.required()` means it must be present.
  JWT_ACCESS_EXPIRES_IN: Joi.string().pattern(expiresInPattern).required(),

  // Same idea as JWT_ACCESS_SECRET, but for the refresh token's own secret.
  // Using a SEPARATE secret (not the same as access) is a deliberate
  // security choice: if one secret leaks, the other
  // token type stays safe (blast radius isolation).
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  // Same idea as JWT_ACCESS_EXPIRES_IN, but validates the refresh token's
  // expiry string
  JWT_REFRESH_EXPIRES_IN: Joi.string().pattern(expiresInPattern).required(),
});