import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RoleType } from '@prisma/client';

export class RoleAssignmentDto {
  @IsUUID()
  coproprieteId: string;

  @IsEnum(RoleType)
  role: RoleType;
}

// Création d'un utilisateur par l'admin du syndic, avec ses rôles par copropriété.
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  motDePasse: string;

  @IsBoolean()
  @IsOptional()
  adminSyndic?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  @IsOptional()
  roles?: RoleAssignmentDto[];
}
