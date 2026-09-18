import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeightEntriesService } from './weight-entries.service';
import { CreateWeightEntryDto } from './dto/create-weight-entry.dto';
import { UpdateWeightEntryDto } from './dto/update-weight-entry.dto';

// Guard applied at the controller level: every route in this controller
// requires a valid access token. No route here should ever be public.
@UseGuards(JwtAuthGuard)
@Controller('weight-entries')
export class WeightEntriesController {
  constructor(private readonly service: WeightEntriesService) {}
  // The specific route names for each endpoint in this controller are empty
  // because the base route is already defined in @Controller('weight-entries'),
  // and each method response to a different call because are decorated with
  // different HTTP method decorators (@Post, @Get, @Patch, @Delete) and route
  // parameters (e.g., ':publicId'):
  // - One @Post and @Get without parameters, which will cause them to respond
  // to basic route with post/get methods.
  // - One @Get, @Patch and @Delete with parameters, which will cause them to
  // respond to basic route with parameters and get/patch/delete methods.

  @Post()
  // @Req decorator injects the entire request object into the method.
  // It is used here to access the authenticated user's ID from req.user,
  // which is populated by JwtStrategy.validate() after successful JWT verification.
  // With that, it's not necessary to pass the userId in the request body,
  // which would be insecure.
  create(@Req() req, @Body() dto: CreateWeightEntryDto) {
    // req.user is populated by JwtStrategy.validate() — same pattern as auth module.
    //
    // @UseGuards(JwtAuthGuard) class decorator triggers the 'jwt' strategy, which
    // verifies the token and then automatically calls
    // JwtStrategy.validate() — its return value becomes req.user.
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.service.findAll(req.user.userId);
  }

  // @Param decorator extracts route parameter (e.g., /weight-entries/:publicId) and
  // assigns it, in this case, to the 'publicId' variable.
  @Get(':publicId')
  findOne(@Req() req, @Param('publicId') publicId: string) {
    return this.service.findOne(publicId, req.user.userId);
  }

  @Patch(':publicId')
  update(@Req() req, @Param('publicId') publicId: string, @Body() dto: UpdateWeightEntryDto) {
    return this.service.update(publicId, req.user.userId, dto);
  }

  @Delete(':publicId')
  // As 'remove' services doesn't return any response/message, then the
  // @HttpCode(HttpStatus.NO_CONTENT) sets the HTTP response status code to
  // '204 No Content', which explicitly communicates: "The operation was
  // successful, and there is intentionally no response data."
  // It's possible to write @HttpCode(204) instead of @HttpCode(HttpStatus.NO_CONTENT),
  // but using the named constant improves code readability and maintainability.
  @HttpCode(HttpStatus.NO_CONTENT) // 204 — DELETE with no response body is the REST convention
  remove(@Req() req, @Param('publicId') publicId: string) {
    return this.service.remove(publicId, req.user.userId);
  }
}