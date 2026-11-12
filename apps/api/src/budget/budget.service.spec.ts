import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { ExerciceService } from './exercice.service';
import { PrismaService } from '../prisma/prisma.service';
import { CoproprieteService } from '../patrimoine/copropriete/copropriete.service';

const COPRO = '11111111-1111-1111-1111-111111111111';
const EX = '22222222-2222-2222-2222-222222222222';

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: any;
  let exercices: any;

  beforeEach(async () => {
    prisma = {
      budget: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      posteBudget: { deleteMany: jest.fn() },
      cleRepartition: { findMany: jest.fn() },
    };
    exercices = {
      ensureModifiable: jest.fn(async () => ({ id: EX, coproprieteId: COPRO })),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: prisma },
        { provide: CoproprieteService, useValue: { ensureExists: jest.fn() } },
        { provide: ExerciceService, useValue: exercices },
      ],
    }).compile();

    service = moduleRef.get(BudgetService);
  });

  it('calcule le total comme la somme des postes (BigInt)', async () => {
    prisma.budget.findUnique.mockResolvedValue({
      id: 'b1',
      postes: [{ montantPrevu: 3000000n }, { montantPrevu: 1200000n }],
      exercice: {},
    });

    const res = await service.findOne('b1');

    expect(res.total).toBe(4200000n);
  });

  it('refuse un second budget pour un exercice déjà pourvu (règle 8.1)', async () => {
    prisma.budget.findFirst.mockResolvedValue({ id: 'existant' });

    await expect(
      service.create(COPRO, {
        exerciceId: EX,
        postes: [{ libelle: 'X', montantPrevu: 1 }],
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('ne soumet pas un budget qui n’est pas en brouillon', async () => {
    prisma.budget.findUnique.mockResolvedValue({
      id: 'b1',
      statut: 'APPROUVE',
      exerciceId: EX,
      _count: { postes: 2 },
    });

    await expect(service.soumettre('b1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('approuve uniquement un budget soumis et horodate l’approbation', async () => {
    prisma.budget.findUnique.mockResolvedValue({
      id: 'b1',
      statut: 'SOUMIS',
      exerciceId: EX,
      _count: { postes: 2 },
    });
    prisma.budget.update.mockResolvedValue({ id: 'b1', statut: 'APPROUVE' });

    await service.approuver('b1');

    expect(prisma.budget.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: expect.objectContaining({
        statut: 'APPROUVE',
        dateApprobation: expect.any(Date),
      }),
    });
  });
});
