/**
 * These are the `class-validator` "decorators":
 * special functions written with an @ symbol above a property that
 * add behavior to it without modifying the property's own code.
 */
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

// "export" allows this class to be imported from other files.
export class RegisterDto {
  // The `@IsEmail()` decorator above is NOT from TypeScript; it comes from the
  // `class-validator` library. At RUNTIME (not compile time), when
  // a request arrives, NestJS uses these decorators to check if the received
  // value is actually a valid email. If it isn't, it automatically rejects
  // the request with a 400 Bad Request error, before your controller or
  // service code even executes.
  // The decorators like '@IsEmail' or 'IsString', etc. validate the data at runtime
  // and needs a validationPipeline to convert the general JSON, from the request, into
  // a real instance/object of the corresponding DTO class, and then run the validations
  // of those decorators. This is done in the `main.ts` file, where a global validation
  // pipe is configured.
  @IsEmail()
  // This is a class PROPERTY.
  email!: string;

  /**
   * Minimum length enforced here at the API boundary. Complexity rules
   * (uppercase, symbols, etc.) are deliberately NOT enforced — modern
   * guidance (NIST) favors length over forced complexity patterns that
   * just push users toward predictable substitutions".
   */
  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt/argon2 practical input limits; also a sane UX cap
  password!: string;

  @IsString()
  @MaxLength(100)
  name!: string;
}