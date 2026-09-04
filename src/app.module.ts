import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // so ConfigService is injectable anywhere without re-importing
      validationSchema: envValidationSchema,
      // Joi coerces/validates on load; if a var is missing or malformed,
      // Nest throws immediately during bootstrap.
    }),
    DatabaseModule, // @Global() in the database.module.ts makes DatabaseService injectable anywhere
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
