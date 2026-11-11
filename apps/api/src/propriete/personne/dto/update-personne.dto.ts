import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
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

  // Si fourni, remplace l'intégralité des contacts.
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  @IsOptional()
  contacts?: CreateContactDto[];
}
