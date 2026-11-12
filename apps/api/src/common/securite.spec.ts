import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Prisma } from '@prisma/client';
import { RegisterDto } from '../auth/dto/register.dto';
import { validerEnv } from '../config/env';
import { depuisPrisma } from './filters/toutes-exceptions.filter';
import {
  contentDisposition,
  contenuConforme,
  typeDeclareAutorise,
} from '../documents/fichiers-autorises';

const register = (motDePasse: string, email = '  Admin@Exemple.CI ') =>
  plainToInstance(RegisterDto, { syndicNom: 'S', pays: 'CI', nom: 'N', email, motDePasse });

describe('Politique de mot de passe / email', () => {
  it.each(['Admin@2026', 'motdepasse1'])('accepte %s', (mdp) => {
    expect(validateSync(register(mdp))).toHaveLength(0);
  });
  it.each(['court1', 'sanschiffre', '12345678'])('refuse %s', (mdp) => {
    expect(validateSync(register(mdp)).length).toBeGreaterThan(0);
  });
  it("normalise l'email", () => {
    expect(register('Admin@2026').email).toBe('admin@exemple.ci');
  });
});

describe('validerEnv', () => {
  const base = { DATABASE_URL: 'postgres://x' };
  it('refuse un secret absent, faible ou « change-me »', () => {
    expect(() => validerEnv({ ...base })).toThrow();
    expect(() => validerEnv({ ...base, JWT_SECRET: 'change-me' })).toThrow();
    expect(() => validerEnv({ ...base, JWT_SECRET: 'court' })).toThrow();
    expect(() =>
      validerEnv({ ...base, JWT_SECRET: '<générer-un-secret-aléatoire-de-48-octets>' }),
    ).toThrow();
  });
  it('accepte un secret de 32+ caractères', () => {
    expect(() => validerEnv({ ...base, JWT_SECRET: 'x'.repeat(48) })).not.toThrow();
  });
});

describe('Erreurs Prisma', () => {
  const err = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('interne', { code, clientVersion: '5' });
  it('P2002 → 409, P2025 → 404, inconnu → null (500 générique)', () => {
    expect(depuisPrisma(err('P2002'))?.statusCode).toBe(409);
    expect(depuisPrisma(err('P2025'))?.statusCode).toBe(404);
    expect(depuisPrisma(err('P1001'))).toBeNull();
    expect(JSON.stringify(depuisPrisma(err('P2002')))).not.toContain('interne');
  });
});

describe('Fichiers autorisés', () => {
  it('extension + MIME', () => {
    expect(typeDeclareAutorise('a.pdf', 'application/pdf')).toBe(true);
    expect(typeDeclareAutorise('a.svg', 'image/svg+xml')).toBe(false);
    expect(typeDeclareAutorise('a.pdf.html', 'application/pdf')).toBe(false);
  });
  it('signature binaire', () => {
    expect(contenuConforme('a.pdf', Buffer.from('%PDF-1.7'))).toBe(true);
    expect(contenuConforme('a.pdf', Buffer.from('<html>'))).toBe(false);
  });
  it('Content-Disposition sûr', () => {
    const h = contentDisposition('../../é"vil\r\n.pdf');
    expect(h.startsWith('attachment;')).toBe(true);
    expect(h).not.toMatch(/[\r\n]/);
    expect(h).not.toContain('../');
  });
});
