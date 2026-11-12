import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EquipementCategorie,
  EquipementEtat,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';
import { CreateEquipementDto } from './dto/create-equipement.dto';
import { UpdateEquipementDto } from './dto/update-equipement.dto';
import { QueryEquipementDto } from './dto/query-equipement.dto';

@Injectable()
export class EquipementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
  ) {}

  async create(coproprieteId: string, dto: CreateEquipementDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    await this.verifierRattachements(
      coproprieteId,
      dto.batimentId,
      dto.partieCommuneId,
    );
    try {
      return await this.prisma.equipement.create({
        data: {
          coproprieteId,
          nom: dto.nom,
          categorie: dto.categorie,
          reference: dto.reference,
          numeroSerie: dto.numeroSerie,
          dateInstallation: dto.dateInstallation
            ? new Date(dto.dateInstallation)
            : undefined,
          garantieFin: dto.garantieFin ? new Date(dto.garantieFin) : undefined,
          fournisseur: dto.fournisseur,
          etat: dto.etat,
          notes: dto.notes,
          batimentId: dto.batimentId,
          partieCommuneId: dto.partieCommuneId,
        },
      });
    } catch (e) {
      throw this.traduireErreur(e, dto.reference);
    }
  }

  findAll(coproprieteId: string, query: QueryEquipementDto) {
    return this.prisma.equipement.findMany({
      where: {
        coproprieteId,
        categorie: query.categorie,
        etat: query.etat,
        batimentId: query.batimentId || undefined,
      },
      include: {
        batiment: { select: { id: true, nom: true } },
        partieCommune: { select: { id: true, nom: true } },
      },
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
    });
  }

  // Vue globale : tous les équipements du syndic (+ copropriété).
  findAllBySyndic(
    syndicId: string,
    query: QueryEquipementDto,
    perimetre?: string[],
  ) {
    return this.prisma.equipement.findMany({
      where: {
        copropriete: { syndicId },
        coproprieteId: query.coproprieteId || undefined,
        // Non-admin : limité aux copropriétés où il a un rôle.
        ...(perimetre ? { AND: [{ coproprieteId: { in: perimetre } }] } : {}),
        categorie: query.categorie,
        etat: query.etat,
        batimentId: query.batimentId || undefined,
      },
      select: {
        id: true,
        nom: true,
        categorie: true,
        reference: true,
        etat: true,
        dateInstallation: true,
        garantieFin: true,
        coproprieteId: true,
        copropriete: { select: { id: true, nom: true } },
        batiment: { select: { id: true, nom: true } },
        partieCommune: { select: { id: true, nom: true } },
      },
      orderBy: [{ coproprieteId: 'asc' }, { categorie: 'asc' }, { nom: 'asc' }],
    });
  }

  async findOne(id: string) {
    const equipement = await this.prisma.equipement.findUnique({
      where: { id },
      include: {
        batiment: { select: { id: true, nom: true } },
        partieCommune: { select: { id: true, nom: true } },
        copropriete: { select: { id: true, nom: true, devise: true } },
      },
    });
    if (!equipement) {
      throw new NotFoundException(`Équipement ${id} introuvable`);
    }
    return equipement;
  }

  async update(id: string, dto: UpdateEquipementDto) {
    const equipement = await this.findOne(id);
    // Rattachements cibles : valeurs du DTO ou existantes.
    const batimentId =
      dto.batimentId !== undefined ? dto.batimentId : equipement.batimentId;
    const partieCommuneId =
      dto.partieCommuneId !== undefined
        ? dto.partieCommuneId
        : equipement.partieCommuneId;
    await this.verifierRattachements(
      equipement.coproprieteId,
      batimentId ?? undefined,
      partieCommuneId ?? undefined,
    );

    try {
      return await this.prisma.equipement.update({
        where: { id },
        data: {
          nom: dto.nom,
          categorie: dto.categorie,
          reference: dto.reference,
          numeroSerie: dto.numeroSerie,
          dateInstallation:
            dto.dateInstallation !== undefined
              ? dto.dateInstallation
                ? new Date(dto.dateInstallation)
                : null
              : undefined,
          garantieFin:
            dto.garantieFin !== undefined
              ? dto.garantieFin
                ? new Date(dto.garantieFin)
                : null
              : undefined,
          fournisseur: dto.fournisseur,
          etat: dto.etat,
          notes: dto.notes,
          batimentId: dto.batimentId,
          partieCommuneId: dto.partieCommuneId,
        },
      });
    } catch (e) {
      throw this.traduireErreur(e, dto.reference ?? equipement.reference);
    }
  }

  // Changement d'état seul (règles 7.13 → 7.17 : en service, panne, maintenance…).
  async changerEtat(id: string, etat: EquipementEtat) {
    await this.findOne(id);
    return this.prisma.equipement.update({ where: { id }, data: { etat } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.equipement.delete({ where: { id } });
    return { id, supprime: true };
  }

  // Compteurs par état/catégorie pour l'en-tête de l'écran (vue synthèse).
  async statistiques(coproprieteId: string) {
    const parEtat = await this.prisma.equipement.groupBy({
      by: ['etat'],
      where: { coproprieteId },
      _count: { _all: true },
    });
    return parEtat.reduce<Record<EquipementEtat, number>>(
      (acc, r) => {
        acc[r.etat] = r._count._all;
        return acc;
      },
      {
        EN_SERVICE: 0,
        EN_PANNE: 0,
        EN_MAINTENANCE: 0,
        HORS_SERVICE: 0,
        REMPLACE: 0,
      },
    );
  }

  // Le bâtiment et la partie commune doivent appartenir à la copropriété.
  private async verifierRattachements(
    coproprieteId: string,
    batimentId?: string,
    partieCommuneId?: string,
  ) {
    if (batimentId) {
      const bat = await this.prisma.batiment.findUnique({
        where: { id: batimentId },
        select: { coproprieteId: true },
      });
      if (!bat) {
        throw new NotFoundException(`Bâtiment ${batimentId} introuvable`);
      }
      if (bat.coproprieteId !== coproprieteId) {
        throw new BadRequestException(
          "Le bâtiment n'appartient pas à cette copropriété",
        );
      }
    }
    if (partieCommuneId) {
      const pc = await this.prisma.partieCommune.findUnique({
        where: { id: partieCommuneId },
        select: { coproprieteId: true },
      });
      if (!pc) {
        throw new NotFoundException(
          `Partie commune ${partieCommuneId} introuvable`,
        );
      }
      if (pc.coproprieteId !== coproprieteId) {
        throw new BadRequestException(
          "La partie commune n'appartient pas à cette copropriété",
        );
      }
    }
  }

  private traduireErreur(e: unknown, reference?: string) {
    // RG : référence d'équipement unique dans la copropriété (@@unique).
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return new ConflictException(
        `Un équipement avec la référence « ${reference} » existe déjà dans cette copropriété`,
      );
    }
    return e;
  }

  // Exposé pour d'éventuels filtres figés côté front.
  static readonly CATEGORIES = Object.values(EquipementCategorie);
}
