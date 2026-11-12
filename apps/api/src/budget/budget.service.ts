import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetStatut, NaturePoste, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CoproprieteService } from '../patrimoine/copropriete/copropriete.service';
import { ExerciceService } from './exercice.service';
import { CreateBudgetDto, PosteBudgetInputDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

// Domaine 8 — Budgets prévisionnels.
@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
    private readonly exercices: ExerciceService,
  ) {}

  async create(coproprieteId: string, dto: CreateBudgetDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    // Règle 8.16 : impossible sur un exercice clôturé.
    const exercice = await this.exercices.ensureModifiable(dto.exerciceId);
    if (exercice.coproprieteId !== coproprieteId) {
      throw new BadRequestException(
        "L'exercice n'appartient pas à cette copropriété",
      );
    }

    // Règle 8.1 : un budget par exercice. Un budget déjà en vie (non rejeté)
    // interdit d'en recréer un : on passe alors par une révision (versioning).
    const existant = await this.prisma.budget.findFirst({
      where: { exerciceId: dto.exerciceId, statut: { not: BudgetStatut.REJETE } },
      select: { id: true },
    });
    if (existant) {
      throw new ConflictException(
        "Un budget existe déjà pour cet exercice : créez une révision plutôt qu'un nouveau budget",
      );
    }

    const postes = await this.validerPostes(coproprieteId, dto.postes);

    return this.prisma.budget.create({
      data: {
        coproprieteId,
        exerciceId: dto.exerciceId,
        libelle: dto.libelle,
        postes: { create: postes },
      },
      include: { postes: true },
    });
  }

  // Liste des budgets d'une copropriété (option : filtrer par exercice).
  findAll(coproprieteId: string, exerciceId?: string) {
    return this.prisma.budget.findMany({
      where: { coproprieteId, exerciceId: exerciceId || undefined },
      orderBy: [{ exerciceId: 'asc' }, { version: 'desc' }],
      include: {
        exercice: { select: { id: true, libelle: true, statut: true } },
        _count: { select: { postes: true } },
      },
    });
  }

  async findOne(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        postes: { include: { cle: { select: { id: true, nom: true } } } },
        exercice: {
          select: {
            id: true,
            libelle: true,
            statut: true,
            dateDebut: true,
            dateFin: true,
          },
        },
      },
    });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} introuvable`);
    }
    // Total = somme des postes (règle 8.6) ; montants entiers → BigInt sérialisé.
    const total = budget.postes.reduce((acc, p) => acc + p.montantPrevu, 0n);
    return { ...budget, total };
  }

  async update(id: string, dto: UpdateBudgetDto) {
    const budget = await this.chargerModifiable(id);
    const data: Prisma.BudgetUpdateInput = { libelle: dto.libelle };

    if (dto.postes) {
      const postes = await this.validerPostes(budget.coproprieteId, dto.postes);
      // Remplacement intégral des postes (budget encore en brouillon).
      await this.prisma.posteBudget.deleteMany({ where: { budgetId: id } });
      data.postes = { create: postes };
    }

    await this.prisma.budget.update({ where: { id }, data });
    return this.findOne(id);
  }

  // Règle 8.4 : soumission à l'assemblée (BROUILLON → SOUMIS).
  async soumettre(id: string) {
    const budget = await this.chargerTransition(id);
    if (budget.statut !== BudgetStatut.BROUILLON) {
      throw new ConflictException(
        `Seul un budget en brouillon peut être soumis (statut actuel : ${budget.statut})`,
      );
    }
    if (budget._count.postes === 0) {
      throw new BadRequestException('Un budget sans poste ne peut être soumis');
    }
    return this.transiter(id, BudgetStatut.SOUMIS);
  }

  // Règle 8.5 : approbation (SOUMIS → APPROUVE). Règle 8.11 : conservé comme référence.
  async approuver(id: string) {
    const budget = await this.chargerTransition(id);
    await this.exercices.ensureModifiable(budget.exerciceId);
    if (budget.statut !== BudgetStatut.SOUMIS) {
      throw new ConflictException(
        `Seul un budget soumis peut être approuvé (statut actuel : ${budget.statut})`,
      );
    }
    return this.prisma.budget.update({
      where: { id },
      data: { statut: BudgetStatut.APPROUVE, dateApprobation: new Date() },
    });
  }

  // Règle 8.5 : rejet (SOUMIS → REJETE).
  async rejeter(id: string) {
    const budget = await this.chargerTransition(id);
    if (budget.statut !== BudgetStatut.SOUMIS) {
      throw new ConflictException(
        `Seul un budget soumis peut être rejeté (statut actuel : ${budget.statut})`,
      );
    }
    return this.transiter(id, BudgetStatut.REJETE);
  }

  // Règle 8.15 : une révision conserve la version précédente (nouveau budget
  // en brouillon, version + 1, postes recopiés et modifiables). Règle 8.5 :
  // un budget approuvé peut être « modifié » par ce biais.
  async reviser(id: string) {
    const source = await this.prisma.budget.findUnique({
      where: { id },
      include: { postes: true },
    });
    if (!source) {
      throw new NotFoundException(`Budget ${id} introuvable`);
    }
    // Règle 8.16 : pas de révision sur un exercice clôturé.
    await this.exercices.ensureModifiable(source.exerciceId);
    if (source.statut === BudgetStatut.BROUILLON) {
      throw new ConflictException(
        'Ce budget est encore en brouillon : modifiez-le directement plutôt que de le réviser',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // La version de référence reste intacte ; on en dérive une nouvelle.
      const derniere = await tx.budget.findFirst({
        where: { exerciceId: source.exerciceId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      return tx.budget.create({
        data: {
          coproprieteId: source.coproprieteId,
          exerciceId: source.exerciceId,
          libelle: source.libelle,
          version: (derniere?.version ?? source.version) + 1,
          statut: BudgetStatut.BROUILLON,
          postes: {
            create: source.postes.map((p) => ({
              libelle: p.libelle,
              categorie: p.categorie,
              cleId: p.cleId,
              nature: p.nature,
              montantPrevu: p.montantPrevu,
            })),
          },
        },
        include: { postes: true },
      });
    });
  }

  // Règles 8.12 à 8.14 : écarts prévu / réalisé par poste et alerte dépassement.
  // La dépense réelle proviendra du module comptable (dépenses/factures) ; tant
  // qu'il n'existe pas, le réalisé est exposé à 0 avec un indicateur explicite,
  // pour que le front sache que la comparaison n'est pas encore alimentée.
  async ecarts(id: string) {
    const budget = await this.findOne(id);
    const postes = budget.postes.map((p) => {
      const realise = 0n; // à brancher sur les dépenses réelles (domaine comptable)
      const ecart = p.montantPrevu - realise;
      return {
        id: p.id,
        libelle: p.libelle,
        categorie: p.categorie,
        nature: p.nature,
        montantPrevu: p.montantPrevu,
        montantRealise: realise,
        ecart,
        depassement: realise > p.montantPrevu, // règle 8.14 : alerte
      };
    });
    const totalRealise = postes.reduce((acc, p) => acc + p.montantRealise, 0n);
    return {
      budgetId: budget.id,
      realiseDisponible: false, // bascule à true quand les dépenses seront suivies
      totalPrevu: budget.total,
      totalRealise,
      ecartTotal: budget.total - totalRealise,
      postes,
    };
  }

  // ---- helpers -------------------------------------------------------------

  // Valide les postes et construit les lignes Prisma (montants → BigInt).
  private async validerPostes(
    coproprieteId: string,
    postes: PosteBudgetInputDto[],
  ) {
    const cleIds = [
      ...new Set(postes.map((p) => p.cleId).filter((x): x is string => !!x)),
    ];
    if (cleIds.length > 0) {
      // Règle 8.8 : les clés référencées doivent appartenir à la copropriété.
      const trouvees = await this.prisma.cleRepartition.findMany({
        where: { id: { in: cleIds }, coproprieteId },
        select: { id: true },
      });
      if (trouvees.length !== cleIds.length) {
        throw new BadRequestException(
          "Une clé de répartition référencée n'appartient pas à cette copropriété",
        );
      }
    }
    return postes.map((p) => ({
      libelle: p.libelle,
      categorie: p.categorie,
      cleId: p.cleId,
      nature: p.nature ?? NaturePoste.RECURRENTE,
      montantPrevu: BigInt(p.montantPrevu),
    }));
  }

  private async chargerModifiable(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      select: { id: true, coproprieteId: true, exerciceId: true, statut: true },
    });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} introuvable`);
    }
    // Un budget n'est éditable qu'en brouillon ; au-delà, on révise (règle 8.15).
    if (budget.statut !== BudgetStatut.BROUILLON) {
      throw new ConflictException(
        `Un budget ${budget.statut.toLowerCase()} n'est plus modifiable : créez une révision`,
      );
    }
    await this.exercices.ensureModifiable(budget.exerciceId);
    return budget;
  }

  private async chargerTransition(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      select: {
        id: true,
        statut: true,
        exerciceId: true,
        _count: { select: { postes: true } },
      },
    });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} introuvable`);
    }
    return budget;
  }

  private transiter(id: string, statut: BudgetStatut) {
    return this.prisma.budget.update({ where: { id }, data: { statut } });
  }
}
