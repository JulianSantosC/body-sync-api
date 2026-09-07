import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

// The primary function of this module is to organize, assemble, and
// package everything needed for authentication to work in your application.
@Module({
  // The `imports` array tells NestJS: "For this module to work, I need
  // to bring in functionality from other external modules."
    imports: [
    // A "blank" (.resgister({})) JwtModule (without global secret/expiresIn) is registered
    // intentionally: secret/expiresIn are passed explicitly in
    // EACH call to sign() (access and refresh tokens use different secrets),
    // so it makes no sense to configure a single secret here. Otherwise
    // something like "JwtModule.register({ secret: 'my_secret' })" would have been configured
    //
    // .register is part of the configuration cycle: In NestJS, third-party
    // modules offer methods like this .register() solely to
    // configure and instantiate the module when the app starts up.
    JwtModule.register({}),

    // PassportModule: Import the Passport.js integration to enable NestJS to handle
    // strategy-based authentication (such as JWT, OAuth, local, etc.).
    PassportModule,
  ],
  // controllers: [AuthController]: Declares the HTTP routes related to
  // authentication (e.g., /auth/login, /auth/register).
  controllers: [AuthController],
  // JwtStrategy must be included in "providers" so that Nest instantiates it
  // (and thereby registers the 'jwt' strategy with Passport) when the
  // application starts up—even if it is never manually injected
  // elsewhere, JwtAuthGuard uses it "under the hood" via Passport. This
  // registers the strategy for extracting and validating JWT tokens from
  // incoming requests. By being listed in providers, NestJS automatically
  // instantiates it upon startup.
  providers: [AuthService, JwtStrategy],
  // The exports array tells NestJS which services from this
  // "toolbox" can be used by other modules in the application.
  // By default, everything declared in providers is private to
  // AuthModule. If a user-related module is created in the future
  // and needs to verify a user profile or execute an AuthService
  // method, those modules will simply need to import AuthModule.
  // Including this export ensures that AuthService is publicly
  // accessible to any module that imports AuthModule.
  exports: [AuthService],
})
export class AuthModule {}