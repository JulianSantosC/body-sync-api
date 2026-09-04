import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

// registerAs() is a NestJS function that needs two parameters: a string namespace
// ('jwt' in this case) and a function that returns an object. The 'jwt' namespace allows
// to call the data as configService.get('jwt.accessSecret').
// The `() => ({ ... })` is an arrow function that returns an object literal. The parentheses
// around the curly braces —'({})'— are necessary to avoid confusion with the function body syntax.
// Without them, TypeScript would interpret the curly braces as the start of a function body instead
// of an object literal, leading to a syntax error. The function that return an object is called
// a Callback function. The callback function is executed when the configService.get('jwt') is called
// and doesn't need a name because it's only used in this one place.
export default registerAs('jwt', () => ({ // As this function only has a single code block, the default is used
  accessSecret: process.env.JWT_ACCESS_SECRET as string,
  // Cast to StringValue is safe here ONLY because env.validation.ts (Joi)
  // already enforced the "\d+[smhd...]" and correct initial structure of the environment variables.
  // This is the single place where the casts of environment variables are done.
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN as StringValue,

  refreshSecret: process.env.JWT_REFRESH_SECRET as string,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN as StringValue,
}));