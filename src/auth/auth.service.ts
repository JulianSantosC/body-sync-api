// Node.js includes a native "crypto" module (no installation required) with
// basic cryptographic functions. We will use two of its utilities:
// - createHash: to hash the refresh token (SHA-256) before saving it.
// - randomBytes: a generator for secure random bytes (to be used later,
//   during refresh token rotation).
import { createHash, randomBytes } from 'crypto';

// "* as argon2" imports the entire package content under a single name
// (argon2), rather than importing individual functions via destructuring { }.
// This approach is used because argon2 exports both functions (hash, verify)
// and constants (argon2id), and grouping them under a namespace is clearer.
import * as argon2 from 'argon2';

// "v7 as uuidv7": the "uuid" package exports several functions (v4, v7, etc.)
// and here "v7" is renamed to "uuidv7" upon import, simply to make the
// name more descriptive throughout the rest of the file.
import { v7 as uuidv7 } from 'uuid';

// NestJS decorators: @Injectable() marks this class as something that
// Nest can "inject" into other classes (or that can receive injected
// items in its own constructor). Without this decorator, Nest does not
// recognize the class as part of its Dependency Injection (DI) system,
// and it could not be used elsewhere without manually instantiating it.
//
// ConflictException / UnauthorizedException: error classes that already come
// with the correct HTTP code associated (409 and 401, respectively). When
// one of them is thrown, Nest automatically constructs the HTTP response
// using that status code and the message you provide—you don't have to handle
// the response manually.
import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';

// JwtService: the @nestjs/jwt class that knows how to sign and verify
// JWT tokens. It is imported here so it can be injected.
import { JwtService } from '@nestjs/jwt';

// ConfigType: utilidad de @nestjs/config que, dado el "typeof" de un
// registerAs(), devuelve el TIPO exacto del objeto que retorna esa
// función factory — o sea, hereda automáticamente los tipos "string" y
// "StringValue" que ya se castearon en jwt.config.ts, sin tener que volver
// a castear nada aquí.
import type { ConfigType } from '@nestjs/config';
import jwtConfig from './config/jwt.config';

// The database service (DatabaseService) is imported to enable
// access and connection to the database, along with the DTOs,
// to use them for typing method parameters.
import { DatabaseService } from '../database/database.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
// This is the class CONSTRUCTOR: it executes automatically when
  // Nest creates an instance of AuthService. However, it has no "body" here
  // (it is empty between the braces { }) because a TypeScript
  // shortcut is being used: by writing "private readonly something: Type"
  // directly in the constructor PARAMETERS, TypeScript automatically:
  //   1. Creates a class property named "db" (and another named "jwtService").
  //   2. Assigns the received value to it.
  // Without this shortcut, it's necessary to write the following manually:
  //   private readonly db: DatabaseService;
  //   constructor(
  //    db: DatabaseService,
  //    jwtService: JwtService
  //   ) {
  //     this.db = db;
  //     this.jwtService = jwtService;
  //   }
  // "private" = accessible only within this class (not from outside).
  // "readonly" = once assigned in the constructor, it cannot be reassigned.
  //
  // Where do these values ​​come from? Nest "injects" them automatically:
  // since DatabaseService and JwtService are @Injectable() (or come from a
  // Nest module, like JwtModule), Nest knows how to construct them and
  // provides them ready to use, without having to manually call "new DatabaseService()".
  // This is called Dependency Injection (DI)—it is the heart of how
  // NestJS organizes code.
  constructor(
    private readonly db: DatabaseService, // Nest knows how to provide an instance of DatabaseService here
    private readonly jwtService: JwtService, // Nest knows how to provide an instance of JwtService here

    // Here, Nest does not know how to provide a value for jwtConfiguration by default,
    // because it is a class that Nest can search for directly. To tell Nest how to inject
    // it, the @Inject() decorator is used with the key of the configuration (jwtConfig.KEY).
    // This way, Nest is instructed not to look up a class by type; instead, it specifically
    // injects the configuration registered with this token.
    @Inject(jwtConfig.KEY)

    // This says that the type of jwtConfiguration is the same as the configuration 
    // defined in jwtConfig. This ensures that TypeScript knows the exact shape
    // and types of the configuration object, allowing for proper type checking
    // and autocompletion.
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  // "async" marks this function as asynchronous: it can use "await" inside,
  // and it automatically returns a Promise (a sort of "receipt" that
  // resolves later with the actual value). Almost anything that interacts with the
  // database or performs slow operations (like hashing passwords) is
  // async in Node.js, because those operations do not block the main thread
  // while they complete.
  async register(dto: RegisterDto) {
    // "await" pauses the execution of THIS function (not the entire program)
    // until the Promise from this.db.query(...) resolves with an
    // actual result. Without "await", "existing" would be the Promise itself, not
    // the result—a very common mistake when working with async/await.
    //
    // "$1" is a parameterized placeholder (protecting against SQL
    // injection). It serves to tell the database: "A dynamic value will go
    // here, but I am not going to provide it directly in the query text; I
    // will pass it separately in a list.".
    // The "pg" driver safely replaces $1 with the value from the array, at
    // the position 1 (the first element of the array). This prevents SQL
    // injection attacks. That's why never concatenating strings directly.
    // 
    const existing = await this.db.query(
      'SELECT id FROM users WHERE email = $1',
      [dto.email],
    );

    // ".rows" is the property where the "pg" driver returns the found
    // rows (it is always an array, even if empty).
    // ".length > 0" simply asks, "Did we find at least one row?"
    if (existing.rows.length > 0) {
      // Generic message on purpose: we don't want to reveal via error text
      // whether an email is registered (user enumeration protection). This
      // check itself is a minor leak (timing/response difference), but a
      // full mitigation (constant-time responses) is overkill for this
      // project's threat model — worth knowing the trade-off exists though.
      throw new ConflictException('Email already in use');
    }

    // argon2.hash() is async because hashing with argon2id is
    // deliberately SLOW and memory-intensive (that is precisely its defense
    // against brute-force attacks)—it would block the thread if it were synchronous.
    //
    // argon2id: the hybrid variant recommended by OWASP, resistant to both
    // GPU cracking (like argon2i) and side-channel attacks (like argon2d).
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    // The UUID v7 will be generated in the application code (not in Postgres), as
    // previously decided.
    const publicId = uuidv7();

    // INSERT with "RETURNING": we ask Postgres to return the
    // specified columns of the newly inserted row in the same query
    // — this avoids having to perform a second SELECT to retrieve the
    // newly created user.
    const result = await this.db.query(
      `INSERT INTO users (public_id, email, password_hash, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, public_id, email, name`,
      [publicId, dto.email, passwordHash, dto.name],
    );

    // The password_hash should never be returner in the response, not
    // even hashed — for that reason, the RETURNING clause above deliberately
    // excludes it.
    return result.rows[0];
  }

  
  async validateUser(email: string, password: string) {
    const result = await this.db.query(
      'SELECT id, public_id, email, password_hash, name FROM users WHERE email = $1',
      [email],
    );

    // As the email is UNIQUE, it's expected to return at most 1 row. If none exists,
    // rows[0] is simply "undefined" in JavaScript.
    const user = result.rows[0];

    // If the user is not found, an error is thrown. This is a security measure
    // to prevent attackers from determining which emails are registered in the system.
    // Same error for "user not found" and "wrong password" — again, to
    // avoid confirming which emails exist in the system.
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // argon2.verify() internally and automatically extracts the salt (a per-user random value)
    // and the parameters EMBEDDED within the hash string itself (which is why
    // the password_hash is a long string); it then takes the provided password, hashes it
    // using that salt and those parameters, and compares the result with the hash stored in the DB.
    const passwordMatches = await argon2.verify(user.password_hash, password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    // Note: user.id (internal bigint) is passed for the FK in refresh_tokens,
    // but user.public_id is used for the JWT payload. (The internal ID must
    // never appear in a token or response.)
    return this.issueTokens(user.id, user.public_id);
  }

  // "private" here means that only methods WITHIN this same class
  // can call issueTokens—neither the controller nor other services
  // can invoke it directly: issuing tokens should only happen as a 
  // result of a successful login or refresh, never as a standalone
  // exposed operation.
   // TODO: validate userId should be received here? Or only the
   // userPublicId and the UserId should be queried from the database
   // in this method to avoid passing the userId directly. (It despends
   // on where is called this method, if is called from back logic it's
   // good, if not, so just receive the userPublicId and query the userId)
  private async issueTokens(userId: number, userPublicId: string) {
    // this.jwtService.sign(payload, options) signs and returns the JWT as a
    // string. The first argument is the "head" with the token type and algorithm,
    // and the second argument is the "payload" (the claims/data that
    // go inside the token). The third argument is the signature/options, where
    // the "head" and the "payload" are combined and signed with the secret key.The result is a
    // string in the format: header.payload.signature, which is the standard JWT format.
    // — The "sub" (subject) is a standard JWT convention
    // used to indicate "whose token this is." —
    //
    // The JWT "sub" (subject) claim carries the public_id, never the
    // internal bigint id — the same IDOR-prevention reasoning applied
    // to API routes applies to token payloads too.
    const accessToken = this.jwtService.sign(
      { sub: userPublicId },
      {
        secret: this.jwtConfiguration.accessSecret,
        expiresIn: this.jwtConfiguration.accessExpiresIn,
      },
    );

    // Same payload, but signed with a DIFFERENT secret and with a
    // longer expiration — which is why "secret" is passed explicitly in
    // each call to sign(), instead of configuring a single global secret
    // in the JwtModule. This refresh token is stored in the database (hashed)
    // so it can be revoked if needed.
    const refreshToken = this.jwtService.sign(
      { sub: userPublicId },
      {
        secret: this.jwtConfiguration.refreshSecret,
        expiresIn: this.jwtConfiguration.refreshExpiresIn,
      },
    );

    // The refresh token is hashed before storing it (SHA-256 is enough here,
    // unlike passwords: a JWT already has high entropy, so it's not at
    // risk of brute-force/dictionary attacks the way a human password is).
    // The SHA-256 hash of the refresh token is stored in the database.
    // The original JWT is returned to the client and is never stored server-side.
    //
    // .update(refreshToken): we pass the string to be hashed.
    // .digest('hex'): we request the result as a hexadecimal string
    // (instead of a binary Buffer) so it can be stored directly in the
    // table's VARCHAR column. The refresh token is already protected against
    // tampering by the JWT signature; this
    // token—which is already signed and secure, is hashed using SHA-256 for added
    // security, since it is not sent directly to the user but rather stored in the
    // database. This is an extra step to protect it in the event that the database
    // is compromised.
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // Date.now() returns the current timestamp in milliseconds. We add
    // the refresh token's duration in milliseconds (converted by
    // the helper below) to calculate the exact expiration date
    // to be stored in the expires_at column.
    const expiresAt = new Date(
      Date.now() + this.parseExpiryToMs(this.jwtConfiguration.refreshExpiresIn),
    );

    // Save the previous data in the refresh_tokens table, linking it to the user by
    // their internal ID.
    await this.db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );

    // Return an object containing both tokens — this one *is* sent in full
    // to the client (unlike the hash, which remains only in the DB).
    return { accessToken, refreshToken };
  }

  // Small helper to convert "7d" / "15m" style strings into milliseconds
  // for the expires_at column, since JwtService accepts the string form
  // but the DB needs an actual timestamp.
  //
  // ": number" at the end of the signature indicates the function's
  // RETURN TYPE — TypeScript will issue a warning at compile time if
  // the function body attempts to return something other than a number.
  private parseExpiryToMs(expiry: string): number {
    // Regular expression: validates that the string follows the format
    // "number + letter" (e.g., "15m", "7d") and CAPTURES both parts
    // separately using parentheses ( ) and ( ).
    // ^ = start of string, $ = end of string (so it doesn't match
    // something like "15m-extra-stuff").
    const match = expiry.match(/^(\d+)([smhd])$/);

    // match() returns null if there is no match — this is explicitly
    // validated to "fail fast" with a clear message, rather than
    // having the error blow up later in a confusing way.
    if (!match) throw new Error(`Invalid expiry format: ${expiry}`);

    // Array destructuring: match[0] is the full string
    // (ignored via the empty comma), match[1] is the first captured
    // group (the number, as a string), match[2] is the second
    // (the unit: s/m/h/d). Each match[x] (except the first one) is
    // saved into each new variable (value and unit) for easier use below.
    const [, value, unit] = match;

    // An object used as a "lookup table": instead of an if/else or
    // switch for each unit, it is indexed directly by the letter.
    const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

    // Number(value) converts the captured string (e.g., "15") into a number.
    // The underscores in 60_000 are simply a visual separator for large numbers
    // in modern Node/TS, they do not affect the value; it is the same
    // as writing 60000.
    return Number(value) * multipliers[unit];
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      // Unlike the access token (which Passport automatically verifies
      // via JwtStrategy), the refresh token is verified here, manually,
      // because it never passes through an endpoint protected by JwtAuthGuard—the
      // client sends it directly in the body of the POST /auth/refresh request.
      // The .verify method takes the JWT header and payload, re-signs them
      // using the same secret key used in issueTokens(), checks if the
      // signature matches, and verifies that the token has not yet expired.
      // If it doesn't match, it throws an exception (caught in the catch block).
      // If it does match, it returns the decoded payload (the { sub: string }
      // object that was signed in issueTokens()).
      payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtConfiguration.refreshSecret,
      });
    } catch {
      // jwtService.verify() throws an exception if the signature is invalid OR
      // if the token has already expired—in both cases, the attempt is treated the same way:
      // invalid credential.
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Hash the provided refresh token to compare it with the stored hash in the database.
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // Add 'LIMIT 1' to the query isn't necessary because the table already has a UNIQUE constraint
    // on token_hash, but it is a good practice to limit the result set when it's expected only one row.
    // This can improve performance slightly, but specifically makes the intention of the query clearer.
    const result = await this.db.query<{ id: number; user_id: number }>(
      `SELECT id, user_id FROM refresh_tokens
      WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
      LIMIT 1`,
      [tokenHash],
    );
    const storedToken = result.rows[0];

    // If the signature is valid but the active hash is NOT found in the DB,
    // it means the token has already been revoked (prior logout) or rotated
    // (already used once). An attempt to reuse an already rotated refresh
    // token is a classic sign of token theft—so, TODO: in a more advanced
    // system, this would trigger an alert or revoke ALL of the user's
    // tokens. For now, we simply reject it.
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not recognized or revoked');
    }

    // Refresh token rotation: the used token is revoked and a new pair
    // (access + refresh) is issued, rather than simply generating a new access token.
    // This limits the usage window of each refresh token to a single use,
    // reducing the impact should one be leaked.
    await this.db.query(
      `UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`,
      [storedToken.id],
    );

    return this.issueTokens(storedToken.user_id, payload.sub);
  }

  async logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    // There is no need to verify the JWT signature here—if the hash does not exist
    // or was already revoked, the UPDATE simply affects no rows,
    // and that is fine: logging out with an invalid token should not be
    // an error, as the desired outcome (that the token is no longer valid) is
    // already achieved.
    await this.db.query(
      `UPDATE refresh_tokens SET revoked_at = now()
      WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );
  }
}