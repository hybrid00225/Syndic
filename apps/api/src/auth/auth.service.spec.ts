import { Test } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('jeton-xyz') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it("refuse un email déjà utilisé (409)", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u0' });
      await expect(
        service.register({
          syndicNom: 'S',
          pays: 'CI',
          nom: 'Admin',
          email: 'a@b.ci',
          motDePasse: 'motdepasse1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('crée syndic + admin et renvoie un token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue({
        id: 'u1',
        email: 'a@b.ci',
        nom: 'Admin',
        syndicId: 's1',
        adminSyndic: true,
      });

      const res = await service.register({
        syndicNom: 'S',
        pays: 'CI',
        nom: 'Admin',
        email: 'a@b.ci',
        motDePasse: 'motdepasse1',
      });

      expect(res.token).toBe('jeton-xyz');
      expect(res.user.adminSyndic).toBe(true);
    });
  });

  describe('login', () => {
    it('email inconnu → 401 (même message, bcrypt exécuté)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const debut = Date.now();
      await expect(
        service.login({ email: 'x@y.ci', motDePasse: 'peu-importe1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      // Comparaison contre le hash factice (coût 12) : pas de réponse instantanée.
      expect(Date.now() - debut).toBeGreaterThan(50);
    });

    it('compte désactivé → 401 même avec le bon mot de passe', async () => {
      const hash = await bcrypt.hash('bonMotDePasse1', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.ci', nom: 'A', motDePasse: hash, actif: false, syndicId: 's1', adminSyndic: false,
      });
      await expect(
        service.login({ email: 'a@b.ci', motDePasse: 'bonMotDePasse1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refuse un mot de passe erroné (401)', async () => {
      const hash = await bcrypt.hash('bonMotDePasse', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.ci',
        motDePasse: hash,
        actif: true,
        syndicId: 's1',
        adminSyndic: false,
      });
      await expect(
        service.login({ email: 'a@b.ci', motDePasse: 'mauvais' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('accepte le bon mot de passe et renvoie un token', async () => {
      const hash = await bcrypt.hash('bonMotDePasse', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.ci',
        nom: 'Admin',
        motDePasse: hash,
        actif: true,
        syndicId: 's1',
        adminSyndic: false,
      });
      const res = await service.login({
        email: 'a@b.ci',
        motDePasse: 'bonMotDePasse',
      });
      expect(res.token).toBe('jeton-xyz');
    });
  });
});
