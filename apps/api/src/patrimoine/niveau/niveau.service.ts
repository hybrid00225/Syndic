import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BatimentService } from '../batiment/batiment.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';

@Injectable()
export class NiveauService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batiments: BatimentService,
  ) {}

  // RG-02 : un niveau doit appartenir à un bâtiment existant.
  async create(batimentId: string, dto: CreateNiveauDto) {
    await this.batiments.ensureExists(batimentId);
    return this.prisma.niveau.create({
      data: { batimentId, nom: dto.nom, ordre: dto.ordre ?? 0 },
    });
  }

  findAll(batimentId: string) {
    return this.prisma.niveau.findMany({
      where: { batimentId },
      orderBy: { ordre: 'asc' },
    });
  }

  async update(id: string, dto: UpdateNiveauDto) {
    await this.ensureExists(id);
    return this.prisma.niveau.update({ where: { id }, data: { ...dto } });
  }

  async ensureExists(id: string) {
    const exists = await this.prisma.niveau.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Niveau ${id} introuvable`);
    }
  }
}
