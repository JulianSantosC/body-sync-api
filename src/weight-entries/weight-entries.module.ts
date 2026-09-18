import { Module } from '@nestjs/common';
import { WeightEntriesController } from './weight-entries.controller';
import { WeightEntriesService } from './weight-entries.service';
import { WeightEntriesRepository } from './weight-entries.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule], // Provides DatabaseService for the repository
  controllers: [WeightEntriesController],
  providers: [WeightEntriesService, WeightEntriesRepository],
})
export class WeightEntriesModule {}