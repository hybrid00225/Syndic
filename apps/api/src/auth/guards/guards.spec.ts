import { ExecutionContext, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { TenantGuard, paramsDeRoute, RESOLVEURS } from './tenant.guard';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUser } from '../auth-user.interface';
import { ADMIN_SYNDIC_KEY, ROLES_KEY } from '../decorators';

const C1 = '11111111-1111-1111-1111-111111111111';
const C2 = '22222222-2222-2222-2222-222222222222';
const ID = '33333333-3333-3333-3333-333333333333';

const ctx = (req: any): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => null,
    getClass: () => null,
  }) as any;

const user = (o: Partial<AuthUser> = {}): AuthUser => ({
  userId: 'u1',
  syndicId: 'S1',
  adminSyndic: false,
  email: 'a@b.ci',
  roles: [],
  ...o,
});

describe('paramsDeRoute', () => {
  it('extrait les couples ressource/paramètre', () => {
    expect(paramsDeRoute('/appels/:id/releve/:personneId')).toEqual([
      ['appels', 'id'],
      ['releve', 'personneId'],
    ]);
  });
});

describe('TenantGuard', () => {
  let prisma: any;
  let guard: TenantGuard;

  beforeEach(() => {
    prisma = {
      copropriete: { findUnique: jest.fn() },
      lot: { findUnique: jest.fn() },
      document: { findUnique: jest.fn() },
    };
    guard = new TenantGuard(prisma);
  });

  it("refuse (404) un lot d'un autre syndic", async () => {
    prisma.lot.findUnique.mockResolvedValue({ coproprieteId: C2, copropriete: { syndicId: 'S2' } });
    const req = { user: user({ adminSyndic: true }), route: { path: '/lots/:id' }, params: { id: ID } };
    await expect(guard.canActivate(ctx(req))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('accepte un lot du syndic (admin) et résout la copropriété', async () => {
    prisma.lot.findUnique.mockResolvedValue({ coproprieteId: C1, copropriete: { syndicId: 'S1' } });
    const req: any = { user: user({ adminSyndic: true }), route: { path: '/lots/:id' }, params: { id: ID } };
    await expect(guard.canActivate(ctx(req))).resolves.toBe(true);
    expect(req.coproprieteIdResolu).toBe(C1);
  });

  it('non-admin sans rôle sur la copropriété → 404', async () => {
    prisma.copropriete.findUnique.mockResolvedValue({ id: C1, syndicId: 'S1' });
    const req = {
      user: user({ roles: [{ coproprieteId: C2, role: RoleType.GESTIONNAIRE }] }),
      route: { path: '/coproprietes/:coproprieteId/lots' },
      params: { coproprieteId: C1 },
    };
    await expect(guard.canActivate(ctx(req))).rejects.toBeInstanceOf(NotFoundException);
  });

  it("refuse un document d'un autre syndic", async () => {
    prisma.document.findUnique.mockResolvedValue({ syndicId: 'S2', coproprieteId: C2 });
    const req = { user: user({ adminSyndic: true }), route: { path: '/documents/:id/download' }, params: { id: ID } };
    await expect(guard.canActivate(ctx(req))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('fail closed : paramètre sans résolveur → refus', async () => {
    const req = { user: user({ adminSyndic: true }), route: { path: '/inconnu/:id' }, params: { id: ID } };
    await expect(guard.canActivate(ctx(req))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('couvre toutes les ressources des routes connues', () => {
    for (const r of ['coproprietes', 'batiments', 'niveaux', 'lots', 'personnes', 'releve', 'detentions', 'cles', 'appels',
      'paiements', 'affectations', 'budgets', 'exercices', 'equipements', 'parties-communes', 'acces', 'reglement-versions', 'documents']) {
      expect(RESOLVEURS[r]).toBeDefined();
    }
  });
});

describe('RolesGuard', () => {
  const reflecteur = (meta: Record<string, unknown>) =>
    ({ getAllAndOverride: (k: string) => meta[k] }) as unknown as Reflector;

  it('GESTIONNAIRE requis : rôle sur la copropriété résolue → OK', () => {
    const g = new RolesGuard(reflecteur({ [ROLES_KEY]: [RoleType.GESTIONNAIRE] }));
    const req = { user: user({ roles: [{ coproprieteId: C1, role: RoleType.GESTIONNAIRE }] }), coproprieteIdResolu: C1 };
    expect(g.canActivate(ctx(req))).toBe(true);
  });

  it('rôle sur une AUTRE copropriété → 403', () => {
    const g = new RolesGuard(reflecteur({ [ROLES_KEY]: [RoleType.GESTIONNAIRE] }));
    const req = { user: user({ roles: [{ coproprieteId: C2, role: RoleType.GESTIONNAIRE }] }), coproprieteIdResolu: C1 };
    expect(() => g.canActivate(ctx(req))).toThrow(ForbiddenException);
  });

  it('@AdminSyndic : non-admin → 403, admin → OK', () => {
    const g = new RolesGuard(reflecteur({ [ADMIN_SYNDIC_KEY]: true }));
    expect(() => g.canActivate(ctx({ user: user() }))).toThrow(ForbiddenException);
    expect(g.canActivate(ctx({ user: user({ adminSyndic: true }) }))).toBe(true);
  });
});

describe('JwtAuthGuard', () => {
  const reflecteur = { getAllAndOverride: () => false } as unknown as Reflector;

  it('refuse un utilisateur désactivé', async () => {
    const jwt: any = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1' }) };
    const prisma: any = { user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', actif: false, roles: [] }) } };
    const g = new JwtAuthGuard(jwt, reflecteur, prisma);
    await expect(
      g.canActivate(ctx({ headers: { authorization: 'Bearer x' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('impose HS256 et relit les droits en base', async () => {
    const jwt: any = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', adminSyndic: true }) };
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1', email: 'a@b.ci', actif: true, syndicId: 'S1', adminSyndic: false, roles: [],
        }),
      },
    };
    const req: any = { headers: { authorization: 'Bearer x' } };
    await new JwtAuthGuard(jwt, reflecteur, prisma).canActivate(ctx(req));
    expect(jwt.verifyAsync).toHaveBeenCalledWith('x', { algorithms: ['HS256'] });
    expect(req.user.adminSyndic).toBe(false); // la base fait foi, pas le jeton
  });
});
