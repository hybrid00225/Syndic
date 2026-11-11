import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PersonneType } from '@prisma/client';
import { CreateContactDto } from './create-contact.dto';

export class CreatePersonneDto {
  @IsEnum(PersonneType)
  type: PersonneType;

  @IsString()
  @IsNotEmpty()
  nom: string; // nom de famille ou raison sociale

  @IsString()
  @IsOptional()
  prenom?: string;
  // Le syndic est dérivé du token d'authentification.

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  @IsOptional()
  contacts?: CreateContactDto[];
}
