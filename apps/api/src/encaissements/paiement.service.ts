import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaiementStatut, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { CreateAffectationDto } from './dto/create-affectation.dto';

@Injectable()
export class PaiementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(coproprieteId: string, dto: CreatePaiementDto) {
    const copro = await this.prisma.copropriete.findUnique({
      where: { id: coproprieteId },
      select: { id: true, syndicId: true },
    });
    if (!copro) {
      throw new NotFoundException(`Copropriété ${coproprieteId} introuvable`);
    }
    const payeur = await this.prisma.personne.findUnique({
      where: { id: dto.payeurId },
      select: { id: true, syndicId: true },
    });
    if (!payeur) {
      throw new NotFoundException(`Personne ${dto.payeurId} introuvable`);
    }
    // RG-31 : payeur du même syndic que la copropriété.
    if (payeur.syndicId !== copro.syndicId) {
      throw new BadRequestException(
        "Le payeur n'appartient pas au même syndic que la copropriété",
      );
    }

    // RG-33 : idempotence — même clé → on renvoie le paiement existant.
    if (dto.idempotencyKey) {
      const existant = await this.prisma.paiement.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existant) {
        return existant;
      }
    }

    const data = {
      coproprieteId,
      payeurId: dto.payeurId,
      dateOperation: dto.dateOperation ? new Date(dto.dateOperation) : new Date(),
      montant: BigInt(dto.montant),
      moyen: dto.moyen,
      referenceBancaire: dto.referenceBancaire,
      statut: dto.statut,
      idempotencyKey: dto.idempotencyKey,
    };

    try {
      return await this.prisma.paiement.create({ data });
    } catch (e) {
      // Course : si la clé a été insérée entre-temps, on renvoie l'existant.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002' &&
        dto.idempotencyKey
      ) {
        const existant = await this.prisma.paiement.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
        });
        if (existant) {
          return existant;
        }
      }
      throw e;
    }
  }

  findAll(coproprieteId: string) {
    return this.prisma.paiement.findMany({
      where: { coproprieteId },
      orderBy: { dateOperation: 'desc' },
    });
  }

  async findOne(id: string) {
    const paiement = await this.prisma.paiement.findUnique({
      where: { id },
      include: { affectations: true },
    });
    if (!paiement) {
      throw new NotFoundException(`Paiement ${id} introuvable`);
    }
    const affecte = paiement.affectations.reduce(
      (acc, a) => acc + a.montantAffecte,
      0n,
    );
    // reste = avance / crédit du payeur (RG-34).
    return { ...paiement, montantAffecte: affecte, reste: paiement.montant - affecte };
  }

  async affecter(paiementId: string, dto: CreateAffectationDto) {
    const paiement = await this.prisma.paiement.findUnique({
      where: { id: paiementId },
      select: { id: true, montant: true, statut: true, coproprieteId: true },
    });
    if (!paiement) {
      throw new NotFoundException(`Paiement ${paiementId} introuvable`);
    }
    // RG-37 : seul un paiement validé peut être affecté.
    if (paiement.statut !== PaiementStatut.VALIDE) {
      throw new BadRequestException(
        `Seul un paiement validé peut être affecté (statut : ${paiement.statut})`,
      );
    }

    const ligne = await this.prisma.ligneAppelDeFonds.findUnique({
      where: { id: dto.ligneAppelId },
      select: {
        id: true,
        montant: true,
        appel: { select: { coproprieteId: true } },
      },
    });
    if (!ligne) {
      throw new NotFoundException(`Ligne d'appel ${dto.ligneAppelId} introuvable`);
    }
    // RG-36 : la ligne appartient à la même copropriété que le paiement.
    if (ligne.appel.coproprieteId !== paiement.coproprieteId) {
      throw new BadRequestException(
        "La ligne n'appartient pas à la copropriété du paiement",
      );
    }

    const montant = BigInt(dto.montantAffecte);

    // RG-34 : ne pas affecter plus que le reste du paiement.
    const restePaiement =
      paiement.montant - (await this.sommeAffecteesPaiement(paiementId));
    if (montant > restePaiement) {
      throw new BadRequestException(
        `Le montant affecté dépasse le reste disponible du paiement (${restePaiement})`,
      );
    }

    // RG-35 : ne pas affecter plus que le solde dû de la ligne.
    const duLigne =
      ligne.montant - (await this.sommeAffecteesLigne(dto.ligneAppelId));
    if (montant > duLigne) {
      throw new BadRequestException(
        `Le montant affecté dépasse le solde dû de la ligne (${duLigne})`,
      );
    }

    return this.prisma.affectationPaiement.create({
      data: { paiementId, ligneAppelId: dto.ligneAppelId, montantAffecte: montant },
    });
  }

  async desaffecter(id: string) {
    const aff = await this.prisma.affectationPaiement.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!aff) {
      throw new NotFoundException(`Affectation ${id} introuvable`);
    }
    await this.prisma.affectationPaiement.delete({ where: { id } });
    return { id, supprime: true };
  }

  // RG-37 : annulation = retrait des affectations + statut ANNULE (pas de suppression).
  async annuler(paiementId: string) {
    const paiement = await this.prisma.paiement.findUnique({
      where: { id: paiementId },
      select: { id: true, statut: true },
    });
    if (!paiement) {
      throw new NotFoundException(`Paiement ${paiementId} introuvable`);
    }
    if (paiement.statut === PaiementStatut.ANNULE) {
      throw new ConflictException('Paiement déjà annulé');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.affectationPaiement.deleteMany({ where: { paiementId } });
      return tx.paiement.update({
        where: { id: paiementId },
        data: { statut: PaiementStatut.ANNULE },
      });
    });
  }

  private async sommeAffecteesPaiement(paiementId: string): Promise<bigint> {
    const r = await this.prisma.affectationPaiement.aggregate({
      _sum: { montantAffecte: true },
      where: { paiementId },
    });
    return r._sum.montantAffecte ?? 0n;
  }

  private async sommeAffecteesLigne(ligneAppelId: string): Promise<bigint> {
    const r = await this.prisma.affectationPaiement.aggregate({
      _sum: { montantAffecte: true },
      where: { ligneAppelId },
    });
    return r._sum.montantAffecte ?? 0n;
  }
}
