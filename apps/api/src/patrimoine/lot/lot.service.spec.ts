import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LotService } from './lot.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';

const COPRO = '11111111-1111-1111-1111-111111111111';
const AUTRE_COPRO = '22222222-2222-2222-2222-222222222222';

describe('LotService (règles de gestion)', () => {
  let service: LotService;
  let prisma: any;
  let coproprietes: any;

  beforeEach(async () => {
    prisma = {
      lot: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      batiment: { findUnique: jest.fn() },
      niveau: { findUnique: jest.fn() },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };
    coproprietes = { ensureExists: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LotService,
        { provide: PrismaService, useValue: prisma },
        { provide: CoproprieteService, useValue: coproprietes },
      ],
    }).compile();

    service = moduleRef.get(LotService);
  });

  it('RG-05 : un niveau sans bâtiment est refusé (400)', async () => {
    await expect(
      service.create(COPRO, {
        reference: 'A101',
        type: 'APPARTEMENT',
        niveauId: 'niv-1',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("RG-04 : un bâtiment d'une autre copropriété est refusé (400)", async () => {
    prisma.batiment.findUnique.mockResolvedValue({
      id: 'bat-1',
      coproprieteId: AUTRE_COPRO,
    });
    await expect(
      service.create(COPRO, {
        reference: 'A101',
        type: 'APPARTEMENT',
        batimentId: 'bat-1',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("RG-05 : un niveau d'un autre bâtiment est refusé (400)", async () => {
    prisma.batiment.findUnique.mockResolvedValue({
      id: 'bat-1',
      coproprieteId: COPRO,
    });
    prisma.niveau.findUnique.mockResolvedValue({
      id: 'niv-1',
      batimentId: 'bat-AUTRE',
    });
    await expect(
      service.create(COPRO, {
        reference: 'A101',
        type: 'APPARTEMENT',
        batimentId: 'bat-1',
        niveauId: 'niv-1',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('RG-03 : une référence en doublon est refusée (409)', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique failed', {
      code: 'P2002',
      clientVersion: '5.22.0',
    } as any);
    prisma.lot.create.mockRejectedValue(p2002);
    await expect(
      service.create(COPRO, {
        reference: 'A101',
        type: 'APPARTEMENT',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('crée un lot valide (sans localisation)', async () => {
    const created = { id: 'lot-1', reference: 'A101' };
    prisma.lot.create.mockResolvedValue(created);

    const res = await service.create(COPRO, {
      reference: 'A101',
      type: 'APPARTEMENT',
    } as any);

    expect(res).toBe(created);
    expect(coproprietes.ensureExists).toHaveBeenCalledWith(COPRO);
  });

  it('accepte un lot avec bâtiment + niveau cohérents', async () => {
    prisma.batiment.findUnique.mockResolvedValue({
      id: 'bat-1',
      coproprieteId: COPRO,
    });
    prisma.niveau.findUnique.mockResolvedValue({
      id: 'niv-1',
      batimentId: 'bat-1',
    });
    const created = { id: 'lot-2', reference: 'A102' };
    prisma.lot.create.mockResolvedValue(created);

    const res = await service.create(COPRO, {
      reference: 'A102',
      type: 'APPARTEMENT',
      batimentId: 'bat-1',
      niveauId: 'niv-1',
    } as any);

    expect(res).toBe(created);
  });

  // --- Opérations sur lots (domaine 2.11 à 2.15) ---------------------------

  it('fusion : marque les lots sources comme FUSIONNE et crée le nouveau lot', async () => {
    prisma.lot.findMany.mockResolvedValue([
      { id: 'l1', statut: 'VACANT', superficie: 50 },
      { id: 'l2', statut: 'VACANT', superficie: 30 },
    ]);
    prisma.lot.create.mockResolvedValue({ id: 'new', reference: 'A1-2' });
    prisma.lot.findUnique.mockResolvedValue({ id: 'new', reference: 'A1-2' });

    await service.fusionner(COPRO, {
      sourceLotIds: ['l1', 'l2'],
      nouveau: { reference: 'A1-2', type: 'APPARTEMENT' },
    } as any);

    // Superficie du nouveau lot = somme des sources (50 + 30).
    expect(prisma.lot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ reference: 'A1-2', superficie: 80 }),
    });
    expect(prisma.lot.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['l1', 'l2'] } },
      data: { statut: 'FUSIONNE' },
    });
  });

  it('fusion : refuse un lot source déjà terminal (409)', async () => {
    prisma.lot.findMany.mockResolvedValue([
      { id: 'l1', statut: 'VACANT', superficie: 50 },
      { id: 'l2', statut: 'FUSIONNE', superficie: 30 },
    ]);
    await expect(
      service.fusionner(COPRO, {
        sourceLotIds: ['l1', 'l2'],
        nouveau: { reference: 'X', type: 'AUTRE' },
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('subdivision : marque la source SUBDIVISE et crée les lots issus (lignée)', async () => {
    prisma.lot.findUnique.mockResolvedValue({
      id: 'src',
      coproprieteId: COPRO,
      statut: 'VACANT',
      batiment: null,
      niveau: null,
    });
    prisma.lot.create.mockResolvedValue({ id: 'child' });

    await service.subdiviser('src', {
      nouveaux: [
        { reference: 'A1a', type: 'APPARTEMENT' },
        { reference: 'A1b', type: 'APPARTEMENT' },
      ],
    } as any);

    // Chaque nouveau lot porte sa lignée (origineLotId = source).
    expect(prisma.lot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ origineLotId: 'src' }),
    });
    expect(prisma.lot.update).toHaveBeenCalledWith({
      where: { id: 'src' },
      data: { statut: 'SUBDIVISE' },
    });
  });

  it("annexe : refuse un lot principal d'une autre copropriété (400)", async () => {
    prisma.lot.findUnique
      .mockResolvedValueOnce({
        id: 'lot',
        coproprieteId: COPRO,
        statut: 'VACANT',
        batiment: null,
        niveau: null,
      }) // findOne(lot)
      .mockResolvedValueOnce({
        id: 'princ',
        coproprieteId: AUTRE_COPRO,
        statut: 'VACANT',
        lotPrincipalId: null,
      }); // principal
    await expect(
      service.annexer('lot', { lotPrincipalId: 'princ' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
