import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppelStatut, NatureDroit } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CoproprieteService } from '../patrimoine/copropriete/copropriete.service';
import { CreateAppelDto } from './dto/create-appel.dto';
import { calculerLignes, LigneCalc, RedevablePart } from './appel-calcul';

interface DetentionRow {
  lotId: string;
  personneId: string;
  quotePartNum: number;
  quotePartDen: number;
  natureDroit: NatureDroit;
}

interface PosteComputed {
  versionId: string;
  libelle: string;
  montant: bigint;
  totalSnapshot: number;
  lignes: LigneCalc[];
}

@Injectable()
export class AppelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
  ) {}

  async create(coproprieteId: string, dto: CreateAppelDto) {
    await this.coproprietes.ensureExists(coproprieteId);

    const dateEmission = dto.dateEmission
      ? new Date(dto.dateEmission)
      : new Date();
    const dateEcheance = new Date(dto.dateEcheance);
    if (dateEcheance.getTime() < dateEmission.getTime()) {
      throw new BadRequestException(
        "La date d'échéance ne peut précéder la date d'émission",
      );
    }

    // Précalcul de chaque poste (hors transaction : lectures + calcul).
    const postesComputed: PosteComputed[] = [];
    for (const poste of dto.postes) {
      // RG-22 : version de clé applicable à la date d'émission, dans CETTE copropriété.
      const version = await this.prisma.cleRepartitionVersion.findFirst({
        where: {
          cleId: poste.cleId,
          dateEffet: { lte: dateEmission },
          OR: [{ dateFin: null }, { dateFin: { gt: dateEmission } }],
          cle: { coproprieteId },
        },
        include: { tantiemes: true },
      });
      if (!version || version.tantiemes.length === 0) {
        throw new BadRequestException(
          `Aucune version de clé exploitable (clé ${poste.cleId}) à la date d'émission`,
        );
      }

      const lotIds = version.tantiemes.map((t) => t.lotId);

      // Détentions actives à la date d'exigibilité (échéance).
      const detentions = (await this.prisma.detentionPropriete.findMany({
        where: {
          lotId: { in: lotIds },
          dateDebut: { lte: dateEcheance },
          OR: [{ dateFin: null }, { dateFin: { gt: dateEcheance } }],
        },
        select: {
          lotId: true,
          personneId: true,
          quotePartNum: true,
          quotePartDen: true,
          natureDroit: true,
        },
      })) as DetentionRow[];

      const redevablesParLot = new Map<string, RedevablePart[]>();
      for (const lotId of lotIds) {
        redevablesParLot.set(
          lotId,
          this.redevablesPourLot(detentions.filter((d) => d.lotId === lotId)),
        );
      }

      // Tout lot chargé doit avoir un redevable (RG-16/robustesse).
      const sansRedevable = lotIds.filter(
        (id) => (redevablesParLot.get(id) ?? []).length === 0,
      );
      if (sansRedevable.length > 0) {
        const lots = await this.prisma.lot.findMany({
          where: { id: { in: sansRedevable } },
          select: { reference: true },
        });
        throw new BadRequestException(
          `Lots sans redevable à la date d'échéance : ${lots
            .map((l) => l.reference)
            .join(', ')}`,
        );
      }

      const lignes = calculerLignes(
        BigInt(poste.montantARepartir),
        version.tantiemes.map((t) => ({ lotId: t.lotId, valeur: t.valeur })),
        redevablesParLot,
      );

      postesComputed.push({
        versionId: version.id,
        libelle: poste.libelle,
        montant: BigInt(poste.montantARepartir),
        totalSnapshot: version.totalTantiemes,
        lignes,
      });
    }

    // Numéro séquentiel par copropriété : AF-<année>-<NNNN>.
    const annee = dateEmission.getFullYear();
    const count = await this.prisma.appelDeFonds.count({
      where: { coproprieteId },
    });
    const numero = `AF-${annee}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const appel = await tx.appelDeFonds.create({
        data: {
          coproprieteId,
          numero,
          type: dto.type,
          motif: dto.motif,
          dateEmission,
          dateEcheance,
        },
      });
      for (const pc of postesComputed) {
        const poste = await tx.posteAppel.create({
          data: {
            appelId: appel.id,
            cleVersionId: pc.versionId,
            libelle: pc.libelle,
            montantARepartir: pc.montant,
          },
        });
        await tx.ligneAppelDeFonds.createMany({
          data: pc.lignes.map((l) => ({
            appelId: appel.id,
            posteId: poste.id,
            lotId: l.lotId,
            redevableId: l.redevableId,
            tantiemeSnapshot: l.tantiemeLot,
            totalSnapshot: pc.totalSnapshot,
            montant: l.montant,
          })),
        });
      }
      return tx.appelDeFonds.findUnique({
        where: { id: appel.id },
        include: { postes: true, lignes: true },
      });
    });
  }

  findAll(coproprieteId: string) {
    return this.prisma.appelDeFonds.findMany({
      where: { coproprieteId },
      orderBy: { dateEmission: 'desc' },
    });
  }

  async findOne(id: string) {
    const appel = await this.prisma.appelDeFonds.findUnique({
      where: { id },
      include: { postes: true, lignes: true },
    });
    if (!appel) {
      throw new NotFoundException(`Appel de fonds ${id} introuvable`);
    }
    return appel;
  }

  // RG : un appel validé n'est plus modifiable.
  async valider(id: string) {
    const appel = await this.chargerPourTransition(id);
    if (appel.statut !== AppelStatut.BROUILLON) {
      throw new ConflictException(
        `Seul un appel en brouillon peut être validé (statut actuel : ${appel.statut})`,
      );
    }
    return this.prisma.appelDeFonds.update({
      where: { id },
      data: { statut: AppelStatut.VALIDE },
    });
  }

  async annuler(id: string) {
    const appel = await this.chargerPourTransition(id);
    if (appel.statut === AppelStatut.ANNULE) {
      throw new ConflictException('Appel déjà annulé');
    }
    return this.prisma.appelDeFonds.update({
      where: { id },
      data: { statut: AppelStatut.ANNULE },
    });
  }

  // Relevé consolidé d'un copropriétaire sur un appel (détail par lot + total).
  async releve(appelId: string, personneId: string) {
    const appel = await this.prisma.appelDeFonds.findUnique({
      where: { id: appelId },
      select: { id: true, numero: true, motif: true, dateEcheance: true },
    });
    if (!appel) {
      throw new NotFoundException(`Appel de fonds ${appelId} introuvable`);
    }
    const lignes = await this.prisma.ligneAppelDeFonds.findMany({
      where: { appelId, redevableId: personneId },
      include: {
        lot: { select: { reference: true } },
        poste: { select: { libelle: true } },
      },
    });
    const total = lignes.reduce((acc, l) => acc + l.montant, 0n);
    const personne = await this.prisma.personne.findUnique({
      where: { id: personneId },
      select: { id: true, nom: true, prenom: true },
    });
    return { appel, personne, total, lignes };
  }

  // L'usufruitier est redevable des charges ; sinon les détenteurs en pleine
  // propriété / indivision, chacun selon sa quote-part.
  private redevablesPourLot(detentions: DetentionRow[]): RedevablePart[] {
    const usufruits = detentions.filter(
      (d) => d.natureDroit === NatureDroit.USUFRUIT,
    );
    const source = usufruits.length
      ? usufruits
      : detentions.filter(
          (d) =>
            d.natureDroit === NatureDroit.PLEINE_PROPRIETE ||
            d.natureDroit === NatureDroit.INDIVISION,
        );
    return source.map((d) => ({
      personneId: d.personneId,
      num: d.quotePartNum,
      den: d.quotePartDen,
    }));
  }

  private async chargerPourTransition(id: string) {
    const appel = await this.prisma.appelDeFonds.findUnique({
      where: { id },
      select: { id: true, statut: true },
    });
    if (!appel) {
      throw new NotFoundException(`Appel de fonds ${id} introuvable`);
    }
    return appel;
  }
}
