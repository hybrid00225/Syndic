import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { INT_MAX } from '../../../common/validation';

export class TantiemeItemDto {
  @IsUUID()
  lotId: string;

  @IsInt()
  @Min(0)
  @Max(INT_MAX)
  valeur: number;
}

export class CreateVersionDto {
  @IsDateString()
  dateEffet: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TantiemeItemDto)
  @ArrayMaxSize(10000)
  tantiemes: TantiemeItemDto[];
}
