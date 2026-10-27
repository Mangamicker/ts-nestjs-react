import { Transform } from 'class-transformer';
import {
  IsString,
  IsArray,
  IsOptional,
  Matches,
  ArrayMaxSize,
  ArrayNotEmpty,
} from 'class-validator';

const NAME_PATTERN = /^[a-z0-9-]+$/;
function normalizeName(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreatePokemonDto {
  @Transform(({ value }) => normalizeName(value))
  @IsString()
  @Matches(NAME_PATTERN)
  name: string;

  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((entry) => normalizeName(entry)) : value,
  )
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @Matches(NAME_PATTERN, { each: true })
  types: string[];

  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((entry) => normalizeName(entry)) : value,
  )
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @Matches(NAME_PATTERN, { each: true })
  abilities: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
