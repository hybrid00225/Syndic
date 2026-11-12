import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, Matches, MaxLength, MinLength } from 'class-validator';

// Bornes numériques partagées (évite les débordements silencieux).
// INT_MAX : colonnes Postgres `integer` (int4).
export const INT_MAX = 2_147_483_647;
// MONTANT_MAX : montants convertis en BigInt depuis un `number` JS — au-delà de
// Number.MAX_SAFE_INTEGER la valeur reçue n'est déjà plus exacte.
export const MONTANT_MAX = Number.MAX_SAFE_INTEGER;
// SUPERFICIE_MAX : colonne Decimal(10, 2).
export const SUPERFICIE_MAX = 99_999_999.99;

// Email normalisé (trim + minuscules) puis validé.
export const EmailNormalise = () =>
  applyDecorators(
    Transform(({ value }) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value,
    ),
    IsEmail({}, { message: 'Adresse email invalide' }),
    MaxLength(254),
  );

// Politique de mot de passe : 8 à 72 caractères (limite bcrypt), au moins une
// lettre et un chiffre.
export const MotDePasseRobuste = () =>
  applyDecorators(
    MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
    MaxLength(72, { message: 'Le mot de passe ne doit pas dépasser 72 caractères' }),
    Matches(/^(?=.*\p{L})(?=.*\d).+$/u, {
      message: 'Le mot de passe doit contenir au moins une lettre et un chiffre',
    }),
  );
