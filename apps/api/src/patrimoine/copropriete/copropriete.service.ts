import { Injectable, NotFoundException } from '@nestjs/common';
import { LotStatut, LotType, ModeRepartition, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoproprieteDto } from './dto/create-copropriete.dto';
import { UpdateCoproprieteDto } from './dto/update-copropriete.dto';
import { CreateCoproprieteCompleteDto } from './dto/create-copropriete-complete.dto';

@Injectable()
export class CoproprieteService {
  constructor(private readonly prisma: PrismaService) {}

  // RG-07 : création → statut initial EN_CREATION (défaut du schéma).
  // syndicId provient du token (garanti valide).
  create(dto: CreateCoproprieteDto, syndicId: string) {
    return this.prisma.copropriete.create({
      data: {
        syndicId,
        nom: dto.nom,
        reference: dto.reference,
        type: dto.type,
        pays: dto.pays,
        adresse: dto.adresse,
        ensembleImmobilier: dto.ensembleImmobilier,
        devise: dto.devise ?? 'XOF',
        natureSyndic: dto.natureSyndic,
        modeRepartition: dto.modeRepartition,
        description: dto.description,
        dateMiseExploitation: dto.dateMiseExploitation
          ? new Date(dto.dateMiseExploitation)
          : undefined,
      },
    });
  }

  // Création complète (copropriété + bâtiments/niveaux + lots) en une transaction.
  createComplete(dto: CreateCoproprieteCompleteDto, syndicId: string) {
    const { batiments, lots, dateMiseExploitation, ...coproFields } = dto;
    return this.prisma.$transaction(async (tx) => {
      const copro = await tx.copropriete.create({
        data: {
          syndicId,
          nom: coproFields.nom,
          reference: coproFields.reference,
          type: coproFields.type,
          pays: coproFields.pays,
          adresse: coproFields.adresse,
          ensembleImmobilier: coproFields.ensembleImmobilier,
          devise: coproFields.devise ?? 'XOF',
          natureSyndic: coproFields.natureSyndic,
          modeRepartition: coproFields.modeRepartition,
          description: coproFields.description,
          dateMiseExploitation: dateMiseExploitation
            ? new Date(dateMiseExploitation)
            : undefined,
        },
      });

      const batIds: string[] = [];
      const nivIds: string[][] = [];
      for (const [bi, b] of (batiments ?? []).entries()) {
        const bat = await tx.batiment.create({
          data: { coproprieteId: copro.id, nom: b.nom },
        });
        batIds[bi] = bat.id;
        nivIds[bi] = [];
        for (const [ni, n] of (b.niveaux ?? []).entries()) {
          const niv = await tx.niveau.create({
            data: { batimentId: bat.id, nom: n.nom, ordre: n.ordre ?? ni },
          });
          nivIds[bi][ni] = niv.id;
        }
      }

      const lotsCrees: { id: string; superficie: Prisma.Decimal | null }[] = [];
      for (const lot of lots ?? []) {
        const batimentId =
          lot.batimentIndex != null ? batIds[lot.batimentIndex] : undefined;
        const niveauId =
          lot.batimentIndex != null && lot.niveauIndex != null
            ? nivIds[lot.batimentIndex]?.[lot.niveauIndex]
            : undefined;
        const cree = await tx.lot.create({
          data: {
            coproprieteId: copro.id,
            reference: lot.reference,
            type: (lot.type as LotType) ?? LotType.AUTRE,
            designation: lot.designation,
            superficie: lot.superficie,
            statut: (lot.statut as LotStatut) ?? undefined,
            batimentId,
            niveauId,
          },
          select: { id: true, superficie: true },
        });
        lotsCrees.push(cree);
      }

      // Répercussion du mode de répartition : on amorce une clé exploitable
      // tout de suite, sinon le mode resterait un simple libellé sans effet.
      await this.amorcerRepartition(
        tx,
        copro.id,
        copro.modeRepartition,
        lotsCrees,
        dateMiseExploitation ? new Date(dateMiseExploitation) : new Date(),
      );

      return tx.copropriete.findUnique({
        where: { id: copro.id },
        include: { batiments: true },
      });
    });
  }

  // À la configuration d'une copropriété, le mode de répartition doit AVOIR un
  // effet concret : on crée une clé « Charges générales » et, s'il y a des lots,
  // une version initiale dont les tantièmes découlent de la superficie (à défaut,
  // parts égales). La répartition est ainsi immédiatement utilisable (appels de
  // fonds). En MONTANT_FIXE il n'y a pas de tantièmes : rien à amorcer.
  private async amorcerRepartition(
    tx: Prisma.TransactionClient,
    coproprieteId: string,
    mode: ModeRepartition,
    lots: { id: string; superficie: Prisma.Decimal | null }[],
    dateEffet: Date,
  ) {
    if (mode === ModeRepartition.MONTANT_FIXE) return;

    const cle = await tx.cleRepartition.create({
      data: {
        coproprieteId,
        nom: 'Charges générales',
        description:
          'Clé par défaut créée à la configuration de la copropriété. Ajustez les tantièmes selon vos règles.',
      },
    });

    if (lots.length === 0) return; // clé prête, tantièmes à saisir plus tard.

    const tantiemes = lots.map((l) => {
      const m2 = l.superficie ? Math.round(Number(l.superficie)) : 0;
      return { lotId: l.id, valeur: m2 > 0 ? m2 : 1 };
    });
    const total = tantiemes.reduce((acc, t) => acc + t.valeur, 0);

    const version = await tx.cleRepartitionVersion.create({
      data: { cleId: cle.id, dateEffet, totalTantiemes: total },
    });
    await tx.tantieme.createMany({
      data: tantiemes.map((t) => ({
        versionId: version.id,
        lotId: t.lotId,
        valeur: t.valeur,
      })),
    });
  }

  findAll(syndicId?: string) {
    return this.prisma.copropriete.findMany({
      where: syndicId ? { syndicId } : undefined,
      orderBy: { dateCreation: 'desc' },
    });
  }

  async findOne(id: string) {
    const copropriete = await this.prisma.copropriete.findUnique({
      where: { id },
      include: { batiments: true },
    });
    if (!copropriete) {
      throw new NotFoundException(`Copropriété ${id} introuvable`);
    }
    return copropriete;
  }

  async update(id: string, dto: UpdateCoproprieteDto) {
    await this.ensureExists(id);
    const { dateMiseExploitation, ...rest } = dto;
    return this.prisma.copropriete.update({
      where: { id },
      data: {
        ...rest,
        ...(dateMiseExploitation !== undefined
          ? { dateMiseExploitation: new Date(dateMiseExploitation) }
          : {}),
      },
    });
  }

  // Utilitaire partagé : garantit l'existence (sinon 404).
  async ensureExists(id: string) {
    const exists = await this.prisma.copropriete.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Copropriété ${id} introuvable`);
    }
  }
}
