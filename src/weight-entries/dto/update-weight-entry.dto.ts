import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class UpdateWeightEntryDto {
  @IsNotEmpty({ message: 'weightKg is required' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(500)
  weightKg!: number;
}