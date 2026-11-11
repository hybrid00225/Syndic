import { Injectable, NotFoundException } from '@nestjs/common';
import { LotStatut, LotType } from '@prisma/client';
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

      for (const lot of lots ?? []) {
        const batimentId =
          lot.batimentIndex != null ? batIds[lot.batimentIndex] : undefined;
        const niveauId =
          lot.batimentIndex != null && lot.niveauIndex != null
            ? nivIds[lot.batimentIndex]?.[lot.niveauIndex]
            : undefined;
        await tx.lot.create({
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
        });
      }

      return tx.copropriete.findUnique({
        where: { id: copro.id },
        include: { batiments: true },
      });
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
