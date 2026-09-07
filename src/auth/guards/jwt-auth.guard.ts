import { Injectable } from '@nestjs/common';
// AuthGuard is a factory function (not a class directly)—when
// called with 'jwt', it returns a Guard class already configured to
// use the strategy registered under that name. It is a common pattern
// in TS: a function that dynamically generates and returns a class.
import { AuthGuard } from '@nestjs/passport';

// There is no need to write any custom logic here — all the work
// (extracting the token, verifying the signature, calling validate(),
// populating request.user) is already handled by AuthGuard('jwt')
// by intercepting the request lifecycle BEFORE it reaches the controller.
// This class exists primarily to provide a specific, reusable name
// (@UseGuards(JwtAuthGuard) instead of @UseGuards(AuthGuard('jwt'))
// on every endpoint), and to allow for adding extra logic later
// (e.g., logging, custom error handling).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}