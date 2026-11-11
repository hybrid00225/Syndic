import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRelanceDto } from './dto/create-relance.dto';
import { calculerImpayes, LigneData } from './recouvrement-calcul';

@Injectable()
export class RecouvrementService {
  constructor(private readonly prisma: PrismaService) {}

  // Impayés groupés par copropriétaire (RG-38 à RG-40).
  async impayes(coproprieteId: string, personneId?: string) {
    const appels = await this.prisma.appelDeFonds.findMany({
      where: { coproprieteId, statut: 'VALIDE' }, // RG-40
      select: {
        numero: true,
        dateEcheance: true,
        lignes: {
          where: personneId ? { redevableId: personneId } : undefined,
          select: {
            id: true,
            montant: true,
            redevableId: true,
            redevable: { select: { nom: true, prenom: true } },
            lot: { select: { reference: true } },
            affectations: { select: { montantAffecte: true } },
          },
        },
      },
    });

    const lignes: LigneData[] = [];
    for (const appel of appels) {
      for (const l of appel.lignes) {
        const affecte = l.affectations.reduce(
          (s, a) => s + a.montantAffecte,
          0n,
        );
        lignes.push({
          id: l.id,
          appelNumero: appel.numero,
          dateEcheance: appel.dateEcheance,
          lotRef: l.lot.reference,
          montant: l.montant,
          affecte,
          redevableId: l.redevableId,
          redevableNom: l.redevable.nom,
          redevablePrenom: l.redevable.prenom,
        });
      }
    }

    return calculerImpayes(lignes, new Date());
  }

  // Situation financière d'un copropriétaire : dû, payé, solde, avances.
  async situation(coproprieteId: string, personneId: string) {
    const lignes = await this.prisma.ligneAppelDeFonds.findMany({
      where: {
        redevableId: personneId,
        appel: { coproprieteId, statut: 'VALIDE' },
      },
      select: { montant: true, affectations: { select: { montantAffecte: true } } },
    });
    const totalDu = lignes.reduce((s, l) => s + l.montant, 0n);
    const totalPaye = lignes.reduce(
      (s, l) => s + l.affectations.reduce((a, x) => a + x.montantAffecte, 0n),
      0n,
    );

    // Avances = paiements validés non (entièrement) affectés.
    const paiements = await this.prisma.paiement.findMany({
      where: { coproprieteId, payeurId: personneId, statut: 'VALIDE' },
      select: { montant: true, affectations: { select: { montantAffecte: true } } },
    });
    const avances = paiements.reduce(
      (s, p) =>
        s +
        (p.montant - p.affectations.reduce((a, x) => a + x.montantAffecte, 0n)),
      0n,
    );

    return {
      personneId,
      totalDu,
      totalPaye,
      solde: totalDu - totalPaye,
      avances,
    };
  }

  // RG-41 : une relance fige le solde réclamé au moment de l'envoi.
  async creerRelance(
    coproprieteId: string,
    personneId: string,
    dto: CreateRelanceDto,
  ) {
    const sit = await this.situation(coproprieteId, personneId);
    return this.prisma.relance.create({
      data: {
        coproprieteId,
        personneId,
        niveau: dto.niveau ?? 1,
        canal: dto.canal,
        commentaire: dto.commentaire,
        montantReclame: sit.solde,
      },
    });
  }

  relances(coproprieteId: string, personneId: string) {
    return this.prisma.relance.findMany({
      where: { coproprieteId, personneId },
      orderBy: { dateEnvoi: 'desc' },
    });
  }
}
