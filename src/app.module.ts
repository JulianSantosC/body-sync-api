import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
 // Import the JWT configuration from jwt.config.ts
 // Import without {} in the name because is a default export. So it's
 // possible to use any name here in the import statement, and without
 // the {} brackets.
import jwtConfig from './auth/config/jwt.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { WeightEntriesModule } from './weight-entries/weight-entries.module';

/*
NestJS operates using a module tree:

AppModule is the root module that bootstraps the application in main.ts.

Any module created (AuthModule, UsersModule, etc.) must be connected—directly or indirectly—to the root module for its components to become active.

When adding AuthModule to AppModule's imports:

- NestJS will read the routes declared in AuthController and create the corresponding endpoints.

- It will instantiate AuthService and the JwtStrategy.

- It will make the entire authentication flow available to the application.
*/
@Module({
  imports: [
    ConfigModule.forRoot({ // Initializes the configuration system and loads variables from .env into the application
      isGlobal: true, // so ConfigService is injectable anywhere without re-importing
       // IT validates the shape AND format of env vars at startup, using the Joi schema defined in env.validation.ts (fail-fast)
      validationSchema: envValidationSchema,
      // Joi coerces/validates on load; if a var is missing or malformed,
      // Nest throws immediately during bootstrap.

      // It builds type-safe, structured access at build time/during development (DX) and give cast in one place for env variables.
      load: [jwtConfig], // Load the JWT configuration from jwt.config.ts
    }),
    DatabaseModule, // @Global() in the database.module.ts makes DatabaseService injectable anywhere
    AuthModule, // Import the AuthModule to make its services available in AppModule
    WeightEntriesModule, // Import the WeightEntriesModule to make its services available in AppModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
