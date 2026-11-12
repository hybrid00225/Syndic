import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EquipementService } from './equipement.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';

const COPRO = 'copro-1';

describe('EquipementService', () => {
  let service: EquipementService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      equipement: { create: jest.fn() },
      batiment: { findUnique: jest.fn() },
      partieCommune: { findUnique: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EquipementService,
        { provide: PrismaService, useValue: prisma },
        { provide: CoproprieteService, useValue: { ensureExists: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(EquipementService);
  });

  const dto = { nom: 'Ascenseur A', categorie: 'ASCENSEUR', reference: 'ASC-001' } as any;

  it('crée un équipement sans rattachement', async () => {
    prisma.equipement.create.mockResolvedValue({ id: 'e1' });
    await service.create(COPRO, dto);
    expect(prisma.equipement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ coproprieteId: COPRO, reference: 'ASC-001' }),
    });
  });

  it("refuse un bâtiment d'une autre copropriété", async () => {
    prisma.batiment.findUnique.mockResolvedValue({ coproprieteId: 'autre' });
    await expect(
      service.create(COPRO, { ...dto, batimentId: 'b1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.equipement.create).not.toHaveBeenCalled();
  });

  it('refuse une partie commune inexistante', async () => {
    prisma.partieCommune.findUnique.mockResolvedValue(null);
    await expect(
      service.create(COPRO, { ...dto, partieCommuneId: 'pc1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('traduit une référence dupliquée (P2002) en 409', async () => {
    prisma.equipement.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '5',
      }),
    );
    await expect(service.create(COPRO, dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
