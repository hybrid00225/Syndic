import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVersionDto } from './dto/create-version.dto';

@Injectable()
export class VersionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(cleId: string, dto: CreateVersionDto) {
    const cle = await this.prisma.cleRepartition.findUnique({
      where: { id: cleId },
      select: { id: true, coproprieteId: true },
    });
    if (!cle) {
      throw new NotFoundException(`Clé de répartition ${cleId} introuvable`);
    }

    const items = dto.tantiemes;
    const lotIds = items.map((i) => i.lotId);

    // RG-20 : un lot ne peut apparaître qu'une fois.
    if (new Set(lotIds).size !== lotIds.length) {
      throw new BadRequestException(
        'Un même lot apparaît plusieurs fois dans la version',
      );
    }

    // RG-18 : tous les lots appartiennent à la copropriété de la clé.
    const lots = await this.prisma.lot.findMany({
      where: { id: { in: lotIds }, coproprieteId: cle.coproprieteId },
      select: { id: true },
    });
    if (lots.length !== lotIds.length) {
      throw new BadRequestException(
        "Un lot n'appartient pas à la copropriété de cette clé",
      );
    }

    // RG-19 : total strictement positif (valeurs ≥ 0 garanties par le DTO).
    const total = items.reduce((acc, i) => acc + i.valeur, 0);
    if (total <= 0) {
      throw new BadRequestException(
        'Le total des tantièmes doit être strictement positif',
      );
    }

    const dateEffet = new Date(dto.dateEffet);

    // RG-21 : la nouvelle version doit être postérieure à la version courante.
    const courante = await this.prisma.cleRepartitionVersion.findFirst({
      where: { cleId, dateFin: null },
    });
    if (courante && courante.dateEffet.getTime() >= dateEffet.getTime()) {
      throw new BadRequestException(
        "La date d'effet doit être postérieure à celle de la version courante",
      );
    }

    // Transaction : clôturer la version courante + créer la nouvelle + tantièmes.
    return this.prisma.$transaction(async (tx) => {
      if (courante) {
        await tx.cleRepartitionVersion.update({
          where: { id: courante.id },
          data: { dateFin: dateEffet },
        });
      }
      const version = await tx.cleRepartitionVersion.create({
        data: { cleId, dateEffet, totalTantiemes: total },
      });
      await tx.tantieme.createMany({
        data: items.map((i) => ({
          versionId: version.id,
          lotId: i.lotId,
          valeur: i.valeur,
        })),
      });
      return tx.cleRepartitionVersion.findUnique({
        where: { id: version.id },
        include: { tantiemes: true },
      });
    });
  }

  findByCle(cleId: string) {
    return this.prisma.cleRepartitionVersion.findMany({
      where: { cleId },
      orderBy: { dateEffet: 'desc' },
    });
  }

  // RG-22 : version applicable à une date (dateEffet ≤ D < dateFin ou dateFin null).
  async applicableAt(cleId: string, date: string) {
    const d = new Date(date);
    const version = await this.prisma.cleRepartitionVersion.findFirst({
      where: {
        cleId,
        dateEffet: { lte: d },
        OR: [{ dateFin: null }, { dateFin: { gt: d } }],
      },
      include: { tantiemes: true },
    });
    if (!version) {
      throw new NotFoundException(
        `Aucune version applicable à la date ${date} pour la clé ${cleId}`,
      );
    }
    return version;
  }
}
