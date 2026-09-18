// This interface represents the shape of a row as it comes back from Postgres.
// We keep the internal `id` (bigint) here because the repository layer works
// with it for joins/updates, but the service layer strips it before returning
// data to the controller — the API must never expose internal bigint IDs.
export interface WeightEntryRow {
   // pg returns BIGINT as string in JS to avoid precision loss. The cast to
   // number is done in the service layer before returning to the controller.
  id: string;
  public_id: string;
  user_id: string;
  entry_date: string; // DATE comes back as 'YYYY-MM-DD' string, not a JS Date
  weight_kg: string; // NUMERIC/DECIMAL also comes back as string from pg driver
  created_at: Date;
}

// This is what actually goes out in API responses — no internal id, no user_id
// (the caller already knows who they are via the JWT).
export interface WeightEntryResponse {
  publicId: string;
  entryDate: string;
  weightKg: number;
  createdAt: Date;
}