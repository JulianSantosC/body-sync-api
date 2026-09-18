import {
  ConflictException,
  //Imported to use later
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WeightEntriesRepository } from './weight-entries.repository';
import { CreateWeightEntryDto } from './dto/create-weight-entry.dto';
import { UpdateWeightEntryDto } from './dto/update-weight-entry.dto';
import { WeightEntryResponse, WeightEntryRow } from './interfaces/weight-entry.interface';

@Injectable()
export class WeightEntriesService {
  constructor(private readonly repository: WeightEntriesRepository) {}

  async create(userId: string, dto: CreateWeightEntryDto): Promise<WeightEntryResponse> {
    try {
      const row = await this.repository.create(userId, dto.entryDate, dto.weightKg);
      return this.toResponse(row);
    } catch (error) {
      // Postgres error code 23505 = unique_violation. This is how the
      // (user_id, entry_date) unique index from the migration surfaces here —
      // It translates the raw DB error into a meaningful HTTP response instead
      // of leaking a Postgres stack trace to the client.
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('A weight entry already exists for this date');
      }
      throw error;
    }
  }

  async findAll(userId: string): Promise<WeightEntryResponse[]> {
    const rows = await this.repository.findAllByUser(userId);
    return rows.map((row) => this.toResponse(row));
  }

  async findOne(publicId: string, userId: string): Promise<WeightEntryResponse> {
    const row = await this.findOwnedOrThrow(publicId, userId);
    return this.toResponse(row);
  }

  async update(
    publicId: string,
    userId: string,
    dto: UpdateWeightEntryDto,
  ): Promise<WeightEntryResponse> {
    const existing = await this.findOwnedOrThrow(publicId, userId);
    const updated = await this.repository.update(existing.id, dto.weightKg!);
    return this.toResponse(updated);
  }

  async remove(publicId: string, userId: string): Promise<void> {
    const existing = await this.findOwnedOrThrow(publicId, userId);
    await this.repository.delete(existing.id);
  }

  // Centralizes the "find by public_id, verify ownership, or fail" flow so
  // findOne/update/remove don't each duplicate this logic.
  private async findOwnedOrThrow(publicId: string, userId: string): Promise<WeightEntryRow> {
    const row = await this.repository.findOneByPublicIdAndUser(publicId, userId);

    if (!row) {
      // Throw NotFound rather than Forbidden here, even
      // though ownership is technically what failed. Returning 403 would
      // confirm to an attacker that the public_id exists but belongs to
      // someone else — 404 leaks no information either way.
      throw new NotFoundException('Weight entry not found or you do not have permission to access it');
    }

    return row;
  }

  // Validate unique index
  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
  }

  // Single place that shapes a DB row into what the API returns — keeps
  // internal id and user_id from ever leaking into a response body.
  private toResponse(row: WeightEntryRow): WeightEntryResponse {
    return {
      publicId: row.public_id,
      entryDate: row.entry_date,
      weightKg: Number(row.weight_kg),
      createdAt: row.created_at,
    };
  }
}