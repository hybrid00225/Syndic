import { Test } from '@nestjs/testing';
import { ReglementService } from './reglement.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';

const COPRO = 'copro-1';

describe('ReglementService (versions du règlement)', () => {
  let service: ReglementService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      reglementVersion: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReglementService,
        { provide: PrismaService, useValue: prisma },
        { provide: CoproprieteService, useValue: { ensureExists: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(ReglementService);
  });

  it('incrémente le numéro de version et devient la version courante', async () => {
    prisma.reglementVersion.findFirst.mockResolvedValue({ version: 2 });
    prisma.reglementVersion.create.mockResolvedValue({ id: 'v3' });

    await service.create(COPRO, { reference: 'Acte 2026' } as any);

    // Les versions courantes précédentes sont déclassées.
    expect(prisma.reglementVersion.updateMany).toHaveBeenCalledWith({
      where: { coproprieteId: COPRO, courant: true },
      data: { courant: false },
    });
    // Nouvelle version = 3, courant = true.
    expect(prisma.reglementVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ version: 3, courant: true }),
    });
  });

  it('première version = v1', async () => {
    prisma.reglementVersion.findFirst.mockResolvedValue(null);
    prisma.reglementVersion.create.mockResolvedValue({ id: 'v1' });

    await service.create(COPRO, {} as any);

    expect(prisma.reglementVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ version: 1, courant: true }),
    });
  });

  it('definirCourante bascule la version en vigueur', async () => {
    prisma.reglementVersion.findUnique.mockResolvedValue({
      id: 'v1',
      coproprieteId: COPRO,
      courant: false,
    });
    await service.definirCourante('v1');

    expect(prisma.reglementVersion.updateMany).toHaveBeenCalledWith({
      where: { coproprieteId: COPRO, courant: true },
      data: { courant: false },
    });
    expect(prisma.reglementVersion.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { courant: true },
    });
  });

  it('en supprimant la version courante, la plus récente restante prend le relais', async () => {
    prisma.reglementVersion.findUnique.mockResolvedValue({
      id: 'v3',
      coproprieteId: COPRO,
      courant: true,
    });
    prisma.reglementVersion.findFirst.mockResolvedValue({ id: 'v2' });

    await service.remove('v3');

    expect(prisma.reglementVersion.delete).toHaveBeenCalledWith({
      where: { id: 'v3' },
    });
    expect(prisma.reglementVersion.update).toHaveBeenCalledWith({
      where: { id: 'v2' },
      data: { courant: true },
    });
  });
});
