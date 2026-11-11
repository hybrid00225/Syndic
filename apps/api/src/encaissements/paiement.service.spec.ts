import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { PrismaService } from '../prisma/prisma.service';

const PAYEUR = '55555555-5555-5555-5555-555555555555';

describe('PaiementService (encaissements)', () => {
  let service: PaiementService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      copropriete: { findUnique: jest.fn() },
      personne: { findUnique: jest.fn() },
      paiement: { findUnique: jest.fn(), create: jest.fn() },
      ligneAppelDeFonds: { findUnique: jest.fn() },
      affectationPaiement: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { montantAffecte: 0n } }),
        create: jest.fn().mockResolvedValue({ id: 'aff-1' }),
      },
    };
    // Par défaut : copropriété et payeur du même syndic S1.
    prisma.copropriete.findUnique.mockResolvedValue({ id: 'C1', syndicId: 'S1' });
    prisma.personne.findUnique.mockResolvedValue({ id: PAYEUR, syndicId: 'S1' });

    const moduleRef = await Test.createTestingModule({
      providers: [PaiementService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(PaiementService);
  });

  describe('create', () => {
    it("RG-33 : idempotence — même clé renvoie l'existant sans recréer", async () => {
      const existant = { id: 'p-existant' };
      prisma.paiement.findUnique.mockResolvedValue(existant);

      const res = await service.create('C1', {
        payeurId: PAYEUR,
        montant: 50000,
        moyen: 'MOBILE_MONEY',
        idempotencyKey: 'tx-123',
      } as any);

      expect(res).toBe(existant);
      expect(prisma.paiement.create).not.toHaveBeenCalled();
    });

    it("RG-31 : payeur d'un autre syndic → 400", async () => {
      prisma.personne.findUnique.mockResolvedValue({
        id: PAYEUR,
        syndicId: 'S2',
      });
      await expect(
        service.create('C1', {
          payeurId: PAYEUR,
          montant: 50000,
          moyen: 'ESPECES',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('crée un paiement valide', async () => {
      prisma.paiement.create.mockResolvedValue({ id: 'p-1' });
      const res = await service.create('C1', {
        payeurId: PAYEUR,
        montant: 50000,
        moyen: 'ESPECES',
      } as any);
      expect(res).toEqual({ id: 'p-1' });
      expect(prisma.paiement.create).toHaveBeenCalled();
    });
  });

  describe('affecter', () => {
    beforeEach(() => {
      prisma.paiement.findUnique.mockResolvedValue({
        id: 'p-1',
        montant: 100000n,
        statut: 'VALIDE',
        coproprieteId: 'C1',
      });
      prisma.ligneAppelDeFonds.findUnique.mockResolvedValue({
        id: 'l-1',
        montant: 50000n,
        appel: { coproprieteId: 'C1' },
      });
    });

    it('RG-37 : un paiement non validé ne peut être affecté → 400', async () => {
      prisma.paiement.findUnique.mockResolvedValue({
        id: 'p-1',
        montant: 100000n,
        statut: 'EN_ATTENTE',
        coproprieteId: 'C1',
      });
      await expect(
        service.affecter('p-1', { ligneAppelId: 'l-1', montantAffecte: 1000 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('RG-34 : affecter plus que le reste du paiement → 400', async () => {
      // déjà 90 000 affectés → reste 10 000
      prisma.affectationPaiement.aggregate.mockResolvedValueOnce({
        _sum: { montantAffecte: 90000n },
      });
      await expect(
        service.affecter('p-1', {
          ligneAppelId: 'l-1',
          montantAffecte: 20000,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('RG-35 : affecter plus que le solde dû de la ligne → 400', async () => {
      prisma.affectationPaiement.aggregate
        .mockResolvedValueOnce({ _sum: { montantAffecte: 0n } }) // reste paiement = 100 000
        .mockResolvedValueOnce({ _sum: { montantAffecte: 40000n } }); // dû ligne = 10 000
      await expect(
        service.affecter('p-1', {
          ligneAppelId: 'l-1',
          montantAffecte: 20000,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('affectation valide → crée l’affectation', async () => {
      const res = await service.affecter('p-1', {
        ligneAppelId: 'l-1',
        montantAffecte: 20000,
      } as any);
      expect(res).toEqual({ id: 'aff-1' });
      expect(prisma.affectationPaiement.create).toHaveBeenCalled();
    });
  });
});
