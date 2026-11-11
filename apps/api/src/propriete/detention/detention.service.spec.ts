import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DetentionService } from './detention.service';
import { PrismaService } from '../../prisma/prisma.service';

const PERSONNE = '44444444-4444-4444-4444-444444444444';

describe('DetentionService (règles de propriété)', () => {
  let service: DetentionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      lot: { findUnique: jest.fn() },
      personne: { findUnique: jest.fn() },
      detentionPropriete: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'det-1' }),
      },
    };
    // Par défaut : lot et personne du même syndic S1.
    prisma.lot.findUnique.mockResolvedValue({
      id: 'lot-1',
      copropriete: { syndicId: 'S1' },
    });
    prisma.personne.findUnique.mockResolvedValue({
      id: PERSONNE,
      syndicId: 'S1',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        DetentionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(DetentionService);
  });

  const baseDto = {
    personneId: PERSONNE,
    quotePartNum: 1,
    quotePartDen: 1,
    dateDebut: '2026-01-01',
  };

  it('RG-10 : personne et lot de syndics différents → 400', async () => {
    prisma.personne.findUnique.mockResolvedValue({
      id: PERSONNE,
      syndicId: 'S2',
    });
    await expect(
      service.create('lot-1', { ...baseDto } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('RG-11 : quote-part invalide (3/2) → 400', async () => {
    await expect(
      service.create('lot-1', {
        ...baseDto,
        quotePartNum: 3,
        quotePartDen: 2,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('RG-12 : dateFin antérieure à dateDebut → 400', async () => {
    await expect(
      service.create('lot-1', {
        ...baseDto,
        dateFin: '2025-12-31',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('RG-13 : 3/5 + 3/5 sur période chevauchante → 409', async () => {
    prisma.detentionPropriete.findMany.mockResolvedValue([
      {
        quotePartNum: 3,
        quotePartDen: 5,
        dateDebut: new Date('2026-01-01'),
        dateFin: null,
      },
    ]);
    await expect(
      service.create('lot-1', {
        ...baseDto,
        quotePartNum: 3,
        quotePartDen: 5,
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('RG-13 : indivision 1/2 + 1/2 = 1 → accepté', async () => {
    prisma.detentionPropriete.findMany.mockResolvedValue([
      {
        quotePartNum: 1,
        quotePartDen: 2,
        dateDebut: new Date('2026-01-01'),
        dateFin: null,
      },
    ]);
    const res = await service.create('lot-1', {
      ...baseDto,
      quotePartNum: 1,
      quotePartDen: 2,
      natureDroit: 'INDIVISION',
    } as any);
    expect(res).toEqual({ id: 'det-1' });
  });

  it('RG-13 : le contrôle est filtré par nature de droit', async () => {
    await service.create('lot-1', {
      ...baseDto,
      natureDroit: 'USUFRUIT',
    } as any);
    expect(prisma.detentionPropriete.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ natureDroit: 'USUFRUIT' }),
      }),
    );
  });

  it('crée une détention valide (pleine propriété 1/1)', async () => {
    const res = await service.create('lot-1', { ...baseDto } as any);
    expect(res).toEqual({ id: 'det-1' });
    expect(prisma.detentionPropriete.create).toHaveBeenCalled();
  });
});
