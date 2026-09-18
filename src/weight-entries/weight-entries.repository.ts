import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { WeightEntryRow } from './interfaces/weight-entry.interface';

@Injectable()
export class WeightEntriesRepository {
  constructor(private readonly db: DatabaseService) {}

  // The internal userId is accepted (bigint as string) here, not the public_id.
  // The service layer is responsible for resolving public_id -> internal id
  // for the *user*, since that resolution already happens once at auth time
  // (req.user carries the internal id from the JWT payload).
  async create(userId: string, entryDate: string, weightKg: number): Promise<WeightEntryRow> {
    // The publicId value is created and saved here as a measure of obfuscation
    // to avoid exposing the internal bigint id in the API, and difficult the
    // extraction of information from the API by malicious actors.
    const publicId = uuidv7();

    const result = await this.db.query<WeightEntryRow>(
      `INSERT INTO weight_entries (public_id, user_id, entry_date, weight_kg)
       VALUES ($1, $2, $3, $4)
       RETURNING id, public_id, user_id, entry_date, weight_kg, created_at`,
      [publicId, userId, entryDate, weightKg],
    );

    return result.rows[0];
  }

  async findAllByUser(userId: string): Promise<WeightEntryRow[]> {
    const result = await this.db.query<WeightEntryRow>(
      `SELECT id, public_id, user_id, entry_date, weight_kg, created_at, updated_at
       FROM weight_entries
       WHERE user_id = $1
       ORDER BY entry_date DESC`,
      [userId],
    );

    return result.rows;
  }


  async findOneByPublicIdAndUser(publicId: string, userId: string): Promise<WeightEntryRow | null> {
    const result = await this.db.query<WeightEntryRow>(
      `SELECT id, public_id, user_id, entry_date, weight_kg, created_at, updated_at
       FROM weight_entries
       WHERE public_id = $1 AND user_id = $2`,
      [publicId, userId],
    );

    return result.rows[0] ?? null;
  }

  async findOneById(id: string): Promise<WeightEntryRow> {
    const result = await this.db.query<WeightEntryRow>(
      `SELECT id, public_id, user_id, entry_date, weight_kg, created_at, updated_at
       FROM weight_entries
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async update(id: string, weightEntry: number): Promise<WeightEntryRow> {
    const result = await this.db.query<WeightEntryRow>(
      `UPDATE weight_entries
       SET weight_kg = $1
       WHERE id = $2
       RETURNING id, public_id, user_id, entry_date, weight_kg, created_at`,
      [weightEntry, id],
    );

    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM weight_entries WHERE id = $1`, [id]);
  }
}