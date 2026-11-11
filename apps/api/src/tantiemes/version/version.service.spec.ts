import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VersionService } from './version.service';
import { PrismaService } from '../../prisma/prisma.service';

const CLE = 'cle-1';
const L1 = '11111111-1111-1111-1111-111111111111';
const L2 = '22222222-2222-2222-2222-222222222222';

describe('VersionService (versioning des tantièmes)', () => {
  let service: VersionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      cleRepartition: { findUnique: jest.fn() },
      lot: { findMany: jest.fn() },
      cleRepartitionVersion: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      tantieme: { createMany: jest.fn() },
      // $transaction exécute le callback avec le mock prisma comme "tx".
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };
    prisma.cleRepartition.findUnique.mockResolvedValue({
      id: CLE,
      coproprieteId: 'C1',
    });
    prisma.lot.findMany.mockResolvedValue([{ id: L1 }, { id: L2 }]);
    prisma.cleRepartitionVersion.findFirst.mockResolvedValue(null);
    prisma.cleRepartitionVersion.create.mockResolvedValue({ id: 'v1' });
    prisma.cleRepartitionVersion.findUnique.mockResolvedValue({
      id: 'v1',
      tantiemes: [],
    });

    const moduleRef = await Test.createTestingModule({
      providers: [VersionService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(VersionService);
  });

  const baseDto = {
    dateEffet: '2026-01-01',
    tantiemes: [
      { lotId: L1, valeur: 60 },
      { lotId: L2, valeur: 40 },
    ],
  };

  it('RG-20 : un lot en double → 400', async () => {
    await expect(
      service.create(CLE, {
        dateEffet: '2026-01-01',
        tantiemes: [
          { lotId: L1, valeur: 10 },
          { lotId: L1, valeur: 20 },
        ],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("RG-18 : un lot d'une autre copropriété → 400", async () => {
    prisma.lot.findMany.mockResolvedValue([{ id: L1 }]); // L2 manquant
    await expect(
      service.create(CLE, { ...baseDto } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('RG-19 : total des tantièmes = 0 → 400', async () => {
    await expect(
      service.create(CLE, {
        dateEffet: '2026-01-01',
        tantiemes: [
          { lotId: L1, valeur: 0 },
          { lotId: L2, valeur: 0 },
        ],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('RG-21 : dateEffet antérieure à la version courante → 400', async () => {
    prisma.cleRepartitionVersion.findFirst.mockResolvedValue({
      id: 'v0',
      dateEffet: new Date('2026-06-01'),
      dateFin: null,
    });
    await expect(
      service.create(CLE, { ...baseDto, dateEffet: '2026-01-01' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crée une version et clôture la précédente (dateFin renseignée)', async () => {
    prisma.cleRepartitionVersion.findFirst.mockResolvedValue({
      id: 'v0',
      dateEffet: new Date('2026-01-01'),
      dateFin: null,
    });
    await service.create(CLE, { ...baseDto, dateEffet: '2026-07-01' } as any);

    expect(prisma.cleRepartitionVersion.update).toHaveBeenCalledWith({
      where: { id: 'v0' },
      data: { dateFin: new Date('2026-07-01') },
    });
    expect(prisma.cleRepartitionVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ totalTantiemes: 100, cleId: CLE }),
    });
  });

  it('crée la première version (total figé = somme)', async () => {
    await service.create(CLE, { ...baseDto } as any);
    expect(prisma.cleRepartitionVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ totalTantiemes: 100 }),
    });
    expect(prisma.tantieme.createMany).toHaveBeenCalled();
  });
});
