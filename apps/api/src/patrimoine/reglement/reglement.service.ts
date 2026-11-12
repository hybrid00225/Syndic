import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';
import { CreateReglementDto } from './dto/create-reglement.dto';
import { UpdateReglementDto } from './dto/update-reglement.dto';

@Injectable()
export class ReglementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
  ) {}

  // Nouvelle version du règlement : numéro auto (max + 1), devient la version
  // courante ; les versions précédentes sont conservées (règle 1.11) mais plus
  // courantes. Une modification du règlement ne recalcule rien rétroactivement.
  async create(coproprieteId: string, dto: CreateReglementDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    const derniere = await this.prisma.reglementVersion.findFirst({
      where: { coproprieteId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (derniere?.version ?? 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      await tx.reglementVersion.updateMany({
        where: { coproprieteId, courant: true },
        data: { courant: false },
      });
      return tx.reglementVersion.create({
        data: {
          coproprieteId,
          version,
          dateAdoption: dto.dateAdoption ? new Date(dto.dateAdoption) : undefined,
          reference: dto.reference,
          description: dto.description,
          documentId: dto.documentId,
          courant: true,
        },
      });
    });
  }

  findAll(coproprieteId: string) {
    return this.prisma.reglementVersion.findMany({
      where: { coproprieteId },
      orderBy: { version: 'desc' },
      include: {
        document: {
          select: { id: true, nomOriginal: true, mimeType: true, taille: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateReglementDto) {
    await this.ensureExists(id);
    return this.prisma.reglementVersion.update({
      where: { id },
      data: {
        dateAdoption:
          dto.dateAdoption !== undefined
            ? dto.dateAdoption
              ? new Date(dto.dateAdoption)
              : null
            : undefined,
        reference: dto.reference,
        description: dto.description,
        documentId: dto.documentId,
      },
    });
  }

  // Désigne une version comme courante (ex. revenir à une version antérieure).
  async definirCourante(id: string) {
    const version = await this.ensureExists(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.reglementVersion.updateMany({
        where: { coproprieteId: version.coproprieteId, courant: true },
        data: { courant: false },
      });
      return tx.reglementVersion.update({
        where: { id },
        data: { courant: true },
      });
    });
  }

  async remove(id: string) {
    const version = await this.ensureExists(id);
    await this.prisma.reglementVersion.delete({ where: { id } });
    // Si on a supprimé la version courante, la plus récente restante prend le relais.
    if (version.courant) {
      const restante = await this.prisma.reglementVersion.findFirst({
        where: { coproprieteId: version.coproprieteId },
        orderBy: { version: 'desc' },
        select: { id: true },
      });
      if (restante) {
        await this.prisma.reglementVersion.update({
          where: { id: restante.id },
          data: { courant: true },
        });
      }
    }
    return { id, supprime: true };
  }

  private async ensureExists(id: string) {
    const version = await this.prisma.reglementVersion.findUnique({
      where: { id },
      select: { id: true, coproprieteId: true, courant: true },
    });
    if (!version) {
      throw new NotFoundException(`Version de règlement ${id} introuvable`);
    }
    return version;
  }
}
