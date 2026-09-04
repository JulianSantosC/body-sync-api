import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
 // Import the JWT configuration from jwt.strategy.ts
 // Import without {} in the name because is a default export. So it's
 // possible to use any name here in the import statement, and without
 // the {} brackets.
import jwtConfig from './auth/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ // Initializes the configuration system and loads variables from .env into the application
      isGlobal: true, // so ConfigService is injectable anywhere without re-importing
       // IT validates the shape AND format of env vars at startup, using the Joi schema defined in env.validation.ts (fail-fast)
      validationSchema: envValidationSchema,
      // Joi coerces/validates on load; if a var is missing or malformed,
      // Nest throws immediately during bootstrap.

      // It builds type-safe, structured access at build time/during development (DX) and give cast in one place for env variables.
      load: [jwtConfig], // Load the JWT configuration from jwt.strategy.ts
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
