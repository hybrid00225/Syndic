import { Test } from '@nestjs/testing';
import { PersonneService } from './personne.service';
import { PrismaService } from '../../prisma/prisma.service';

const COPRO = 'copro-1';

describe('PersonneService — copropriétaires d’une copropriété', () => {
  let service: PersonneService;
  let prisma: any;

  beforeEach(async () => {
    prisma = { personne: { findMany: jest.fn().mockResolvedValue([]) } };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PersonneService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(PersonneService);
  });

  it('ne retient par défaut que les détentions EN COURS (dateFin: null)', async () => {
    await service.coproprietairesDeCopropriete(COPRO);
    const arg = prisma.personne.findMany.mock.calls[0][0];
    // Filtre personnes = celles ayant une détention en cours dans la copro.
    expect(arg.where).toEqual({
      detentions: { some: { lot: { coproprieteId: COPRO }, dateFin: null } },
    });
    // Les détentions incluses suivent le même filtre.
    expect(arg.include.detentions.where).toEqual({
      lot: { coproprieteId: COPRO },
      dateFin: null,
    });
  });

  it('inclut l’historique quand demandé (pas de filtre dateFin)', async () => {
    await service.coproprietairesDeCopropriete(COPRO, true);
    const arg = prisma.personne.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({
      detentions: { some: { lot: { coproprieteId: COPRO } } },
    });
    expect(arg.include.detentions.where).toEqual({ lot: { coproprieteId: COPRO } });
  });
});
