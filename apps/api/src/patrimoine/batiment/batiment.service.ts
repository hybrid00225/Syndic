import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';
import { CreateBatimentDto } from './dto/create-batiment.dto';
import { UpdateBatimentDto } from './dto/update-batiment.dto';

@Injectable()
export class BatimentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
  ) {}

  // RG-01 : un bâtiment doit appartenir à une copropriété existante.
  async create(coproprieteId: string, dto: CreateBatimentDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    return this.prisma.batiment.create({
      data: { coproprieteId, nom: dto.nom },
    });
  }

  findAll(coproprieteId: string) {
    return this.prisma.batiment.findMany({
      where: { coproprieteId },
      orderBy: { nom: 'asc' },
    });
  }

  // Vue globale : tous les bâtiments du syndic (+ compteurs).
  findAllBySyndic(syndicId: string, coproprieteId?: string) {
    return this.prisma.batiment.findMany({
      where: {
        copropriete: { syndicId },
        coproprieteId: coproprieteId || undefined,
      },
      select: {
        id: true,
        nom: true,
        coproprieteId: true,
        copropriete: { select: { id: true, nom: true } },
        _count: { select: { niveaux: true, lots: true } },
      },
      orderBy: { nom: 'asc' },
    });
  }

  async update(id: string, dto: UpdateBatimentDto) {
    await this.ensureExists(id);
    return this.prisma.batiment.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    try {
      await this.prisma.batiment.delete({ where: { id } });
      return { id, supprime: true };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'Ce bâtiment contient des niveaux ou des lots : videz-le avant de le supprimer.',
        );
      }
      throw e;
    }
  }

  async ensureExists(id: string) {
    const exists = await this.prisma.batiment.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Bâtiment ${id} introuvable`);
    }
  }
}
