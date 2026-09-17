import { IsNotEmpty, IsDateString, IsNumber, Max, Min } from 'class-validator';

export class CreateWeightEntryDto {
  @IsNotEmpty({ message: 'entryDate is required' })
  @IsDateString() // Validates 'YYYY-MM-DD' or full ISO 8601 format
  entryDate!: string;

  @IsNotEmpty({ message: 'weightKg is required' })
  @IsNumber({ maxDecimalPlaces: 2 }) // Matches DECIMAL(5,2) column precision
  @Min(20) // Additional validation, just guards against typos
  @Max(500)
  weightKg!: number;
}