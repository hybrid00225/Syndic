import { Test } from '@nestjs/testing';
import { CoproprieteService } from './copropriete.service';
import { PrismaService } from '../../prisma/prisma.service';

const SYNDIC = '33333333-3333-3333-3333-333333333333';

describe('CoproprieteService', () => {
  let service: CoproprieteService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      copropriete: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
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
});
