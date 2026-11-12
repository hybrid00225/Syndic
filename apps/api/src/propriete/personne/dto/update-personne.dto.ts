import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import {
  ModeNotification,
  NatureRepresentation,
  PersonneStatut,
} from '@prisma/client';
import { CreateContactDto } from './create-contact.dto';

export class UpdatePersonneDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  prenom?: string;

  @IsBoolean()
  @IsOptional()
  actif?: boolean;

  @IsEnum(PersonneStatut)
  @IsOptional()
  statut?: PersonneStatut;

  @IsEnum(ModeNotification)
  @IsOptional()
  modeNotification?: ModeNotification;

  // null = retirer le représentant.
  @IsUUID()
  @IsOptional()
  representantId?: string | null;

  @IsEnum(NatureRepresentation)
  @IsOptional()
  natureRepresentation?: NatureRepresentation | null;

  // Si fourni, remplace l'intégralité des contacts.
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  @IsOptional()
  contacts?: CreateContactDto[];
}
