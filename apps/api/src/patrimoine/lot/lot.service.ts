import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LotStatut, LotType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { QueryLotDto } from './dto/query-lot.dto';

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
  ) {
    return this.prisma.lot.findMany({
      where: {
        copropriete: { syndicId },
        coproprieteId: query.coproprieteId || undefined,
        type: (query.type as LotType) || undefined,
        statut: (query.statut as LotStatut) || undefined,
        batimentId: query.batimentId || undefined,
      },
      select: {
        id: true,
        reference: true,
        type: true,
        designation: true,
        superficie: true,
        statut: true,
        coproprieteId: true,
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
