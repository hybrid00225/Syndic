import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';
import { CreatePartieCommuneDto } from './dto/create-partie-commune.dto';
import { UpdatePartieCommuneDto } from './dto/update-partie-commune.dto';

@Injectable()
export class PartieCommuneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
  ) {}

  async create(coproprieteId: string, dto: CreatePartieCommuneDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    if (dto.batimentId) {
      await this.verifierBatiment(coproprieteId, dto.batimentId);
    }
    return this.prisma.partieCommune.create({
      data: {
        coproprieteId,
        nom: dto.nom,
        type: dto.type,
        description: dto.description,
        batimentId: dto.batimentId,
      },
    });
  }

  findAll(coproprieteId: string) {
    return this.prisma.partieCommune.findMany({
      where: { coproprieteId },
      orderBy: { nom: 'asc' },
      include: {
        batiment: { select: { id: true, nom: true } },
        _count: { select: { equipements: true } },
      },
    });
  }

  async update(id: string, dto: UpdatePartieCommuneDto) {
    const pc = await this.ensureExists(id);
    if (dto.batimentId) {
      await this.verifierBatiment(pc.coproprieteId, dto.batimentId);
    }
    return this.prisma.partieCommune.update({
      where: { id },
      data: {
        nom: dto.nom,
        type: dto.type,
        description: dto.description,
        batimentId: dto.batimentId,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    // Garde applicative : la FK équipement→partie commune est optionnelle (SET
    // NULL), donc on bloque explicitement pour ne pas détacher des équipements
    // par inadvertance.
    const rattaches = await this.prisma.equipement.count({
      where: { partieCommuneId: id },
    });
    if (rattaches > 0) {
      throw new ConflictException(
        `Des équipements (${rattaches}) sont rattachés à cette partie commune : détachez-les avant de la supprimer.`,
      );
    }
    await this.prisma.partieCommune.delete({ where: { id } });
    return { id, supprime: true };
  }

  private async ensureExists(id: string) {
    const pc = await this.prisma.partieCommune.findUnique({
      where: { id },
      select: { id: true, coproprieteId: true },
    });
    if (!pc) {
      throw new NotFoundException(`Partie commune ${id} introuvable`);
    }
    return pc;
  }

  // Le bâtiment doit exister et appartenir à la même copropriété.
  private async verifierBatiment(coproprieteId: string, batimentId: string) {
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
}
