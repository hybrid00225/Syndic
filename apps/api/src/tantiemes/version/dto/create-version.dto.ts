import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class TantiemeItemDto {
  @IsUUID()
  lotId: string;

  @IsInt()
  @Min(0)
  valeur: number;
}

export class CreateVersionDto {
  @IsDateString()
  dateEffet: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TantiemeItemDto)
  tantiemes: TantiemeItemDto[];
}
