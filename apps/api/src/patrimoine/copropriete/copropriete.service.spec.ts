import { Test } from '@nestjs/testing';
import { CoproprieteService } from './copropriete.service';
import { PrismaService } from '../../prisma/prisma.service';

const SYNDIC = '33333333-3333-3333-3333-333333333333';

describe('CoproprieteService', () => {
  let service: CoproprieteService;
  let prisma: any;

  // Client de transaction factice : chaque entité renvoie un id incrémental.
  let tx: any;

  beforeEach(async () => {
    let seq = 0;
    const createReturningId = jest.fn(async (args: any) => ({
      id: `id-${++seq}`,
      superficie: args?.data?.superficie ?? null,
    }));
    tx = {
      copropriete: {
        create: jest.fn(async (args: any) => ({
          id: 'copro-1',
          modeRepartition: args.data.modeRepartition,
        })),
        findUnique: jest.fn(async () => ({ id: 'copro-1' })),
      },
      batiment: { create: createReturningId },
      niveau: { create: createReturningId },
      lot: { create: createReturningId },
      cleRepartition: { create: jest.fn(async () => ({ id: 'cle-1' })) },
      cleRepartitionVersion: { create: jest.fn(async () => ({ id: 'ver-1' })) },
      tantieme: { createMany: jest.fn() },
    };

    prisma = {
      copropriete: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CoproprieteService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(CoproprieteService);
  });

  it('applique la devise XOF par défaut et le syndic du token', async () => {
    prisma.copropriete.create.mockResolvedValue({ id: 'c1' });

    await service.create({ nom: 'Résidence Alpha', pays: 'CI' } as any, SYNDIC);

    expect(prisma.copropriete.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        devise: 'XOF',
        nom: 'Résidence Alpha',
        syndicId: SYNDIC,
      }),
    });
  });

  it('amorce une clé « Charges générales » avec des tantièmes = superficies', async () => {
    await service.createComplete(
      {
        nom: 'Rés. Tantièmes',
        pays: 'CI',
        modeRepartition: 'TANTIEMES',
        lots: [
          { reference: 'A1', superficie: 80 },
          { reference: 'A2', superficie: 40 },
        ],
      } as any,
      SYNDIC,
    );

    expect(tx.cleRepartition.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nom: 'Charges générales' }),
      }),
    );
    // totalTantiemes = 80 + 40.
    expect(tx.cleRepartitionVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ totalTantiemes: 120 }),
    });
    const tantiemes = tx.tantieme.createMany.mock.calls[0][0].data;
    expect(tantiemes.map((t: any) => t.valeur)).toEqual([80, 40]);
  });

  it('utilise des parts égales quand les lots sont sans superficie', async () => {
    await service.createComplete(
      {
        nom: 'Rés. Égalité',
        pays: 'CI',
        modeRepartition: 'TANTIEMES',
        lots: [{ reference: 'A1' }, { reference: 'A2' }, { reference: 'A3' }],
      } as any,
      SYNDIC,
    );

    expect(tx.cleRepartitionVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ totalTantiemes: 3 }),
    });
    const tantiemes = tx.tantieme.createMany.mock.calls[0][0].data;
    expect(tantiemes.map((t: any) => t.valeur)).toEqual([1, 1, 1]);
  });

  it("n'amorce aucune clé en mode MONTANT_FIXE", async () => {
    await service.createComplete(
      {
        nom: 'Rés. Fixe',
        pays: 'CI',
        modeRepartition: 'MONTANT_FIXE',
        lots: [{ reference: 'A1', superficie: 50 }],
      } as any,
      SYNDIC,
    );

    expect(tx.cleRepartition.create).not.toHaveBeenCalled();
    expect(tx.cleRepartitionVersion.create).not.toHaveBeenCalled();
  });
});
