import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CoproprieteService } from './copropriete.service';
import { PrismaService } from '../../prisma/prisma.service';

const SYNDIC = '33333333-3333-3333-3333-333333333333';

describe('CoproprieteService', () => {
  let service: CoproprieteService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      syndic: { findUnique: jest.fn() },
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

  it("refuse la création si le syndic n'existe pas (404)", async () => {
    prisma.syndic.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ nom: 'Résidence Alpha', pays: 'CI', syndicId: SYNDIC }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('applique la devise XOF par défaut', async () => {
    prisma.syndic.findUnique.mockResolvedValue({ id: SYNDIC });
    prisma.copropriete.create.mockResolvedValue({ id: 'c1' });

    await service.create({ nom: 'Résidence Alpha', pays: 'CI', syndicId: SYNDIC });

    expect(prisma.copropriete.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ devise: 'XOF', nom: 'Résidence Alpha' }),
    });
  });
});
