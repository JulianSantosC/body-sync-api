import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

// @Global() is a special decorator: normally, if you want to use a
// provider (like DatabaseService) in another module (like AuthModule), that
// module would have to explicitly include "imports: [DatabaseModule]".
// @Global() eliminates that need—once DatabaseModule is imported
// ONCE in the root AppModule, DatabaseService becomes available for
// injection into ANY module in the application without repeating the import.
//
// Not everything should be global, but for something as
// cross-cutting as database access, it is the standard pattern.
@Global()
// Tells Nest that this module is a "provider module":
// it knows how to create and inject providers (DatabaseService) and exports them
// so that other modules can use them. @Module tells Nest that this class is a
// NestJS module—and what it contains—so Nest knows how to handle it
// internally (dependency injection, lifecycle, etc.).
// @Module also contains the full configuration, that's why the
// 'export class DatabaseModule {}' is empty: all the configuration is in the
// @Module decorator.
@Module({
  // "providers" are the classes that this module knows how to construct and inject.
  providers: [DatabaseService],
  // "exports" lists the providers that other modules can use. Without this
  // line, DatabaseService would exist ONLY within DatabaseModule, even
  // if it had @Global().
  exports: [DatabaseService],
})
export class DatabaseModule {} // Class to which the configuration above applies