import { Injectable, Inject } from '@nestjs/common';
// PassportStrategy: a function that takes a Passport strategy (in this
// case, "Strategy" from passport-jwt) and wraps it as a class compatible
// with Nest's Dependency Injection system. Extending this class
// connects the code to Passport's internal engine.
import { PassportStrategy } from '@nestjs/passport';
// ExtractJwt: a passport-jwt helper with various functions ready to
// "extract" the token from different parts of a request (header, cookie,
// query param, etc.).
// "Strategy" is the base class that knows how to validate
// a JWT's signature once the token has been extracted.
import { Strategy, ExtractJwt } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';

// The name "'jwt'" that Passport uses internally to identify this
// strategy comes from the second argument of the @UseGuards decorator
// further down (AuthGuard('jwt')) — they must match.
//
// This JwtStrategy class is called automatically when a request is
// made to an endpoint protected by the JwtAuthGuard (whhere the endpoint
// uses @UseGuards(JwtAuthGuard) to protect it and call automatic this
// JwtStrategy class).
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    // "ConfigType<typeof jwtConfig>" is a TypeScript utility type that
    // extracts the type of the configuration object returned by the"jwtConfig"
    // function. This ensures that "jwtConfiguration" has the correct shape
    // and types, allowing for proper type checking and autocompletion.
    jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {
    // "super(...)" calls the parent class constructor (PassportStrategy,
    // which wraps "Strategy" from passport-jwt). It MUST be the first thing
    // inside the constructor of a class that extends another—this is how
    // TS/JS correctly initializes inheritance. Here, we pass the
    // configuration that passport-jwt needs to know HOW to validate
    // an incoming token.
    super({
      // Where it gets the token from: the "Authorization: Bearer <token>" header.
      // This replaces the manual work of parsing the header
      // — passport-jwt already knows how to do it.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),


      // If the token has already expired (according to its "exp" claim), Passport
      // will reject it automatically BEFORE reaching the "validate()" method below.
      ignoreExpiration: false,

      // The key used to verify the token's signature — it must be the
      // SAME secret used to sign it in issueTokens(). Note that
      // accessSecret is used here (not refreshSecret): this strategy only
      // protects standard endpoints and never validates refresh tokens (that
      // is handled manually in "AuthService.refresh()", below).
      secretOrKey: jwtConfiguration.accessSecret,
    });
  }

  // This method is NOT called manually—Passport invokes it
  // automatically, and ONLY if the token signature has already been verified as
  // valid (if the signature fails, execution never reaches this point; Passport
  // halts the flow earlier with an automatic 401 response).
  //
  // "payload" is the already-decoded content of the JWT (the object
  // { sub, secret, expiresIn } constructed during signing in "issueTokens").
  //
  // The return value becomes available as "request.user" throughout the
  // remainder of the request lifecycle (e.g., within controllers); this
  // happens because Passport automatically assigns whatever is returned by
  // this "validate" method to the ".user" property of the "request" object.
  // Note: the '{}' around "sub: string" indicate that "payload"
  // is an object with a "sub" property of type string.
  validate(payload: { sub: string }) {
    // Note: We do not query the database here to look up
    // the full user. That is precisely the advantage of JWT (it does not check
    // the database, but rather verifies the token's integrity and signature)—validating
    // a request shouldn't require a DB query on every call.
    // If a specific endpoint needs more user data
    // (name, email, etc.), it fetches it separately using this publicId.
    // Here, we simply confirm "whose token this is."
    return { publicId: payload.sub };
  }
}