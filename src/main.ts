import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // NestJS needs to be explicitly told: "when a request arrives, take the body, convert
  // it into an instance of the corresponding DTO class, and run the validations defined
  // by those decorators." That is exactly what the ValidationPipe does.
  // "Global" means it automatically applies to all of the application's endpoints, without 
  // having to repeat this configuration in each controller.
  app.useGlobalPipes(
    new ValidationPipe({
      // Removes any property from the object that is NOT declared in the DTO.
      // E.g., if someone sends { email, password, name, isAdmin: true },
      // "isAdmin" is silently removed before reaching your controller.
      whitelist: true,

      // If "whitelist" strips out properties, setting "forbidNonWhitelisted" to true
      // would cause the entire request to be rejected with an error instead.
      // We're leaving it as false (the default), it's possible to change it to true to
      // be stricter.
      forbidNonWhitelisted: false,

      // Automatically converts the flat body (JSON) into an actual instance
      // of the RegisterDto/LoginDto class, instead of leaving it as a generic object.
      transform: true,
    })
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
