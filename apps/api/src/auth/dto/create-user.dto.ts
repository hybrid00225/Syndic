import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { RoleType } from '@prisma/client';
import { EmailNormalise, MotDePasseRobuste } from '../../common/validation';

export class RoleAssignmentDto {
  @IsUUID()
  coproprieteId: string;

  @IsEnum(RoleType)
  role: RoleType;
}

// Création d'un utilisateur par l'admin du syndic, avec ses rôles par copropriété.
// adminSyndic est volontairement accepté ici : seule une route réservée à
// l'administrateur du syndic utilise ce DTO.
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom: string;

  @EmailNormalise()
  email: string;

  @IsString()
  @MotDePasseRobuste()
  motDePasse: string;

  @IsBoolean()
  @IsOptional()
  adminSyndic?: boolean;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  @IsOptional()
  roles?: RoleAssignmentDto[];
}
