import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// @Controller('auth') defines the base route prefix: all endpoints
// in this class reside under /auth/... (e.g., /auth/login, /auth/register).
@Controller('auth')
export class AuthController {
  // Same constructor injection pattern.
  constructor(private readonly authService: AuthService) {}

  // @Post indica que este método solo responde a solicitudes HTTP POST. El path relativo es 'register',
  @Post('register')
  // @Body() tells NestJS to extract the data sent by the client in the
  // HTTP request (located in the request body, typically in JSON
  // format); thanks to the previously configured global ValidationPipe,
  // the data arrives already converted and validated as an actual
  // instance of RegisterDto (rather than a generic object).
  //
  // @Body() dto: RegisterDto: Extracts the entire request body and
  // maps it to the RegisterDto type.
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  // @HttpCode(...): Defines the HTTP status code the server will send
  // to the client if the operation succeeds.
  // By default, Nest responds with 201 Created for any @Post() request.
  // For login, the correct standard is 200 OK. Thus, without manually
  // creating a new resource, @HttpCode(HttpStatus.OK) changes the response to 200 OK.
  @HttpCode(HttpStatus.OK) // Changes the response status code to 200 OK.
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  // @Body('refreshToken') refreshToken: string: Extracts only a specific
  // property named refreshToken (of type string) from the JSON body.
  // Note: RegisterDto/LoginDto and class-validator are NOT used here yet
  // — it is a simple object with a single field. A RefreshTokenDto
  // with @IsString() could be created for consistency; it is not
  // strictly necessary right now, but could be added (TODO).
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}