import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Lot, LotStatut, LotType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { QueryLotDto } from './dto/query-lot.dto';
import {
  AnnexerLotDto,
  ChangerDestinationDto,
  FusionLotDto,
  LotNouveauInput,
  SubdivisionLotDto,
} from './dto/operations-lot.dto';

// Statuts terminaux : le lot n'existe plus physiquement mais reste pour l'historique.
const STATUTS_TERMINAUX: LotStatut[] = [LotStatut.FUSIONNE, LotStatut.SUBDIVISE];

@Injectable()
export class LotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
  ) {}

  async create(coproprieteId: string, dto: CreateLotDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    // RG-04 / RG-05 : cohérence bâtiment ↔ niveau ↔ copropriété.
    await this.verifierCoherenceLocalisation(coproprieteId, dto.batimentId, dto.niveauId);

    try {
      return await this.prisma.lot.create({
        data: {
          coproprieteId,
          reference: dto.reference,
          type: dto.type,
          designation: dto.designation,
          superficie: dto.superficie,
          statut: dto.statut,
          batimentId: dto.batimentId,
          niveauId: dto.niveauId,
        },
      });
    } catch (e) {
      // RG-03 : référence unique dans la copropriété (contrainte @@unique).
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `Un lot avec la référence « ${dto.reference} » existe déjà dans cette copropriété`,
        );
      }
      throw e;
    }
  }

  findAll(coproprieteId: string, query: QueryLotDto) {
    return this.prisma.lot.findMany({
      where: {
        coproprieteId,
        type: query.type,
        statut: query.statut,
      },
      orderBy: { reference: 'asc' },
    });
  }

  // Vue globale : tous les lots des copropriétés du syndic.
  findAllBySyndic(
    syndicId: string,
    query: {
      coproprieteId?: string;
      type?: string;
      statut?: string;
      batimentId?: string;
    },
    perimetre?: string[],
  ) {
    return this.prisma.lot.findMany({
      where: {
        copropriete: { syndicId },
        coproprieteId: query.coproprieteId || undefined,
        type: (query.type as LotType) || undefined,
        statut: (query.statut as LotStatut) || undefined,
        batimentId: query.batimentId || undefined,
        // Non-admin : limité aux copropriétés où il a un rôle.
        ...(perimetre ? { AND: [{ coproprieteId: { in: perimetre } }] } : {}),
      },
      select: {
        id: true,
        reference: true,
        type: true,
        designation: true,
        superficie: true,
        statut: true,
        coproprieteId: true,
        batimentId: true,
        niveauId: true,
        copropriete: { select: { id: true, nom: true } },
        batiment: { select: { id: true, nom: true } },
      },
      orderBy: [{ coproprieteId: 'asc' }, { reference: 'asc' }],
    });
  }

  async findOne(id: string) {
    const lot = await this.prisma.lot.findUnique({
      where: { id },
      include: { batiment: true, niveau: true },
    });
    if (!lot) {
      throw new NotFoundException(`Lot ${id} introuvable`);
    }
    return lot;
  }

  async update(id: string, dto: UpdateLotDto) {
    const lot = await this.findOne(id);
    // La localisation cible peut venir du DTO ou rester celle du lot.
    const batimentId =
      dto.batimentId !== undefined ? dto.batimentId : lot.batimentId;
    const niveauId = dto.niveauId !== undefined ? dto.niveauId : lot.niveauId;
    await this.verifierCoherenceLocalisation(
      lot.coproprieteId,
      batimentId ?? undefined,
      niveauId ?? undefined,
    );

    try {
      return await this.prisma.lot.update({ where: { id }, data: { ...dto } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `Un lot avec la référence « ${dto.reference} » existe déjà dans cette copropriété`,
        );
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.lot.delete({ where: { id } });
      return { id, supprime: true };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'Ce lot est référencé (propriété, tantièmes ou appels de fonds) et ne peut être supprimé.',
        );
      }
      throw e;
    }
  }

  // --- Opérations sur lots (domaine 2.11 à 2.15) --------------------------

  // Règle 2.11 : rattacher un lot (cave, parking…) à un lot principal.
  async annexer(id: string, dto: AnnexerLotDto) {
    const lot = await this.findOne(id);
    this.refuserSiTerminal(lot.statut);
    if (dto.lotPrincipalId === id) {
      throw new BadRequestException('Un lot ne peut pas être sa propre annexe');
    }
    const principal = await this.prisma.lot.findUnique({
      where: { id: dto.lotPrincipalId },
      select: { id: true, coproprieteId: true, statut: true, lotPrincipalId: true },
    });
    if (!principal) {
      throw new NotFoundException(`Lot principal ${dto.lotPrincipalId} introuvable`);
    }
    if (principal.coproprieteId !== lot.coproprieteId) {
      throw new BadRequestException(
        "Le lot principal doit appartenir à la même copropriété",
      );
    }
    this.refuserSiTerminal(principal.statut);
    // On reste sur un seul niveau d'annexe : un principal ne peut pas être lui-même une annexe.
    if (principal.lotPrincipalId) {
      throw new BadRequestException(
        'Le lot principal est déjà une annexe : choisissez un lot principal de premier niveau',
      );
    }
    return this.prisma.lot.update({
      where: { id },
      data: { lotPrincipalId: dto.lotPrincipalId },
    });
  }

  async detacher(id: string) {
    await this.findOne(id);
    return this.prisma.lot.update({
      where: { id },
      data: { lotPrincipalId: null },
    });
  }

  // Règle 2.15 : changement de destination (type d'usage) du lot.
  async changerDestination(id: string, dto: ChangerDestinationDto) {
    const lot = await this.findOne(id);
    this.refuserSiTerminal(lot.statut);
    return this.prisma.lot.update({
      where: { id },
      data: { type: dto.type, designation: dto.designation },
    });
  }

  // Règle 2.13 : fusion de plusieurs lots en un nouveau lot. NON destructif :
  // les lots sources passent au statut FUSIONNE (conservés pour l'historique
  // des appels/tantièmes) ; un nouveau lot est créé. Pas de recalcul rétroactif.
  async fusionner(coproprieteId: string, dto: FusionLotDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    const ids = [...new Set(dto.sourceLotIds)];
    if (ids.length < 2) {
      throw new BadRequestException('Une fusion requiert au moins deux lots distincts');
    }
    const sources = await this.prisma.lot.findMany({
      where: { id: { in: ids }, coproprieteId },
      select: { id: true, statut: true, superficie: true },
    });
    if (sources.length !== ids.length) {
      throw new BadRequestException(
        "Un lot source est introuvable ou n'appartient pas à cette copropriété",
      );
    }
    for (const s of sources) this.refuserSiTerminal(s.statut);

    await this.verifierCoherenceLocalisation(
      coproprieteId,
      dto.nouveau.batimentId,
      dto.nouveau.niveauId,
    );

    // Superficie du nouveau lot : fournie, sinon somme des superficies sources.
    const superficie =
      dto.nouveau.superficie ??
      this.sommeSuperficies(sources.map((s) => s.superficie));

    return this.prisma.$transaction(async (tx) => {
      const nouveau = await this.creerLot(
        tx,
        coproprieteId,
        { ...dto.nouveau, superficie },
        null,
      );
      await tx.lot.updateMany({
        where: { id: { in: ids } },
        data: { statut: LotStatut.FUSIONNE },
      });
      return tx.lot.findUnique({ where: { id: nouveau.id } });
    });
  }

  // Règle 2.14 : subdivision d'un lot en plusieurs nouveaux lots. NON destructif :
  // le lot source passe au statut SUBDIVISE ; chaque nouveau lot garde sa lignée.
  async subdiviser(id: string, dto: SubdivisionLotDto) {
    const source = await this.findOne(id);
    this.refuserSiTerminal(source.statut);
    if (dto.nouveaux.length < 2) {
      throw new BadRequestException('Une subdivision requiert au moins deux nouveaux lots');
    }
    const refs = dto.nouveaux.map((n) => n.reference);
    if (new Set(refs).size !== refs.length) {
      throw new BadRequestException('Les références des nouveaux lots doivent être distinctes');
    }

    return this.prisma.$transaction(async (tx) => {
      const crees: Lot[] = [];
      for (const n of dto.nouveaux) {
        await this.verifierCoherenceLocalisation(
          source.coproprieteId,
          n.batimentId,
          n.niveauId,
        );
        crees.push(await this.creerLot(tx, source.coproprieteId, n, id));
      }
      await tx.lot.update({
        where: { id },
        data: { statut: LotStatut.SUBDIVISE },
      });
      return crees;
    });
  }

  // Création d'un lot (fusion/subdivision) avec sa lignée, dans une transaction.
  private async creerLot(
    tx: Prisma.TransactionClient,
    coproprieteId: string,
    data: LotNouveauInput,
    origineLotId: string | null,
  ) {
    try {
      return await tx.lot.create({
        data: {
          coproprieteId,
          reference: data.reference,
          type: data.type,
          designation: data.designation,
          superficie: data.superficie,
          statut: data.statut ?? LotStatut.VACANT,
          batimentId: data.batimentId,
          niveauId: data.niveauId,
          origineLotId: origineLotId ?? undefined,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `Un lot avec la référence « ${data.reference} » existe déjà dans cette copropriété`,
        );
      }
      throw e;
    }
  }

  private sommeSuperficies(valeurs: (Prisma.Decimal | null)[]): number | undefined {
    const nombres = valeurs.filter((v): v is Prisma.Decimal => v != null);
    if (nombres.length === 0) return undefined;
    return nombres.reduce((acc, v) => acc + Number(v), 0);
  }

  private refuserSiTerminal(statut: LotStatut) {
    if (STATUTS_TERMINAUX.includes(statut)) {
      throw new ConflictException(
        `Ce lot est ${statut.toLowerCase()} (terminal) : il est conservé pour l'historique et n'est plus modifiable`,
      );
    }
  }

  // Contrôles RG-04 et RG-05, factorisés pour create() et update().
  private async verifierCoherenceLocalisation(
    coproprieteId: string,
    batimentId?: string,
    niveauId?: string,
  ) {
    // RG-05 : un niveau implique un bâtiment.
    if (niveauId && !batimentId) {
      throw new BadRequestException(
        'Un lot rattaché à un niveau doit aussi préciser son bâtiment',
      );
    }

    if (batimentId) {
      const batiment = await this.prisma.batiment.findUnique({
        where: { id: batimentId },
        select: { id: true, coproprieteId: true },
      });
      if (!batiment) {
        throw new NotFoundException(`Bâtiment ${batimentId} introuvable`);
      }
      // RG-04 : le bâtiment doit appartenir à la même copropriété.
      if (batiment.coproprieteId !== coproprieteId) {
        throw new BadRequestException(
          "Le bâtiment n'appartient pas à cette copropriété",
        );
      }
    }

    if (niveauId) {
      const niveau = await this.prisma.niveau.findUnique({
        where: { id: niveauId },
        select: { id: true, batimentId: true },
      });
      if (!niveau) {
        throw new NotFoundException(`Niveau ${niveauId} introuvable`);
      }
      // RG-05 : le niveau doit appartenir au bâtiment fourni.
      if (niveau.batimentId !== batimentId) {
        throw new BadRequestException(
          "Le niveau n'appartient pas au bâtiment indiqué",
        );
      }
    }
  }
}
