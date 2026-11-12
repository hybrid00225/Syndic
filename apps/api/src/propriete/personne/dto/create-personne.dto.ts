import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import {
  ModeNotification,
  NatureRepresentation,
  PersonneStatut,
  PersonneType,
} from '@prisma/client';
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

  @IsEnum(PersonneStatut)
  @IsOptional()
  statut?: PersonneStatut;

  @IsEnum(ModeNotification)
  @IsOptional()
  modeNotification?: ModeNotification;

  @IsUUID()
  @IsOptional()
  representantId?: string;

  @IsEnum(NatureRepresentation)
  @IsOptional()
  natureRepresentation?: NatureRepresentation;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  @IsOptional()
  @ArrayMaxSize(50)
  contacts?: CreateContactDto[];
}
