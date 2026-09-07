import {IsEmail, IsString,} from 'class-validator';

/**
 * Temporally it only validates the email and password, but it can be extended to validate name instead
 * of email, or initialize with google and other social media accounts
 */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}