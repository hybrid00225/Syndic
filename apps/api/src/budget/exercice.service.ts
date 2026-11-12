import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExerciceStatut } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CoproprieteService } from '../patrimoine/copropriete/copropriete.service';
import { CreateExerciceDto } from './dto/create-exercice.dto';
import { UpdateExerciceDto } from './dto/update-exercice.dto';

// Domaine 25 — Exercices comptables, clôtures.
@Injectable()
export class ExerciceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
  ) {}

  async create(coproprieteId: string, dto: CreateExerciceDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    const dateDebut = new Date(dto.dateDebut);
    const dateFin = new Date(dto.dateFin);
    if (dateFin.getTime() <= dateDebut.getTime()) {
      throw new BadRequestException(
        "La date de fin d'exercice doit suivre la date de début",
      );
    }

    // Règle 25.1 : plusieurs exercices possibles, mais ils ne doivent pas se
    // chevaucher dans le temps pour une même copropriété.
    const chevauchement = await this.prisma.exercice.findFirst({
      where: {
        coproprieteId,
        dateDebut: { lt: dateFin },
        dateFin: { gt: dateDebut },
      },
      select: { libelle: true },
    });
    if (chevauchement) {
      throw new ConflictException(
        `La période chevauche l'exercice « ${chevauchement.libelle} »`,
      );
    }

    return this.prisma.exercice.create({
      data: { coproprieteId, libelle: dto.libelle, dateDebut, dateFin },
    });
  }

  findAll(coproprieteId: string) {
    return this.prisma.exercice.findMany({
      where: { coproprieteId },
      orderBy: { dateDebut: 'desc' },
      include: { _count: { select: { budgets: true } } },
    });
  }

  async findOne(id: string) {
    const exercice = await this.prisma.exercice.findUnique({
      where: { id },
      include: {
        budgets: {
          orderBy: { version: 'desc' },
          include: { _count: { select: { postes: true } } },
        },
      },
    });
    if (!exercice) {
      throw new NotFoundException(`Exercice ${id} introuvable`);
    }
    return exercice;
  }

  async update(id: string, dto: UpdateExerciceDto) {
    const exercice = await this.findOne(id);
    // Règle 25.7 : un exercice clôturé est verrouillé.
    if (exercice.statut === ExerciceStatut.CLOTURE) {
      throw new ConflictException(
        "Un exercice clôturé est verrouillé et ne peut être modifié",
      );
    }
    const dateDebut = dto.dateDebut
      ? new Date(dto.dateDebut)
      : exercice.dateDebut;
    const dateFin = dto.dateFin ? new Date(dto.dateFin) : exercice.dateFin;
    if (dateFin.getTime() <= dateDebut.getTime()) {
      throw new BadRequestException(
        "La date de fin d'exercice doit suivre la date de début",
      );
    }
    return this.prisma.exercice.update({
      where: { id },
      data: { libelle: dto.libelle, dateDebut, dateFin },
    });
  }

  // Règles 25.4→25.6 : transitions OUVERT → EN_CLOTURE → CLOTURE.
  async demarrerCloture(id: string) {
    const exercice = await this.findOne(id);
    if (exercice.statut !== ExerciceStatut.OUVERT) {
      throw new ConflictException(
        `Seul un exercice ouvert peut entrer en clôture (statut actuel : ${exercice.statut})`,
      );
    }
    return this.transiter(id, ExerciceStatut.EN_CLOTURE);
  }

  async rouvrir(id: string) {
    const exercice = await this.findOne(id);
    // Tant que la clôture n'est pas définitive, on peut revenir en arrière.
    if (exercice.statut !== ExerciceStatut.EN_CLOTURE) {
      throw new ConflictException(
        `Seul un exercice en cours de clôture peut être rouvert (statut actuel : ${exercice.statut})`,
      );
    }
    return this.transiter(id, ExerciceStatut.OUVERT);
  }

  async cloturer(id: string) {
    const exercice = await this.findOne(id);
    if (exercice.statut === ExerciceStatut.CLOTURE) {
      throw new ConflictException('Exercice déjà clôturé');
    }
    if (exercice.statut !== ExerciceStatut.EN_CLOTURE) {
      throw new ConflictException(
        "La clôture doit d'abord être amorcée (passage en cours de clôture)",
      );
    }
    // Règle 8.5/8.11 : un exercice ne se clôture pas tant qu'un budget reste à
    // valider (ni brouillon ni soumis en attente de décision).
    const enCours = await this.prisma.budget.count({
      where: { exerciceId: id, statut: { in: ['BROUILLON', 'SOUMIS'] } },
    });
    if (enCours > 0) {
      throw new ConflictException(
        'Des budgets sont encore à valider (brouillon ou soumis) : traitez-les avant de clôturer',
      );
    }
    return this.transiter(id, ExerciceStatut.CLOTURE);
  }

  // Garantit que l'exercice existe et n'est pas verrouillé (pour les budgets).
  async ensureModifiable(id: string) {
    const exercice = await this.prisma.exercice.findUnique({
      where: { id },
      select: { id: true, coproprieteId: true, statut: true },
    });
    if (!exercice) {
      throw new NotFoundException(`Exercice ${id} introuvable`);
    }
    // Règle 8.16 : les budgets d'un exercice clôturé ne sont pas modifiables.
    if (exercice.statut === ExerciceStatut.CLOTURE) {
      throw new ConflictException(
        "L'exercice est clôturé : ses budgets ne sont plus modifiables",
      );
    }
    return exercice;
  }

  private transiter(id: string, statut: ExerciceStatut) {
    return this.prisma.exercice.update({ where: { id }, data: { statut } });
  }
}
