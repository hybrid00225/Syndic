import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ContactType } from '@prisma/client';

export class CreateContactDto {
  @IsEnum(ContactType)
  type: ContactType;

  @IsString()
  @IsNotEmpty()
  valeur: string; // email, téléphone ou adresse — validé selon le type (RG-15)

  @IsString()
  @IsOptional()
  libelle?: string;

  @IsBoolean()
  @IsOptional()
  principal?: boolean;
}
