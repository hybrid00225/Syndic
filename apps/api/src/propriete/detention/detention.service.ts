import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NatureDroit } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Fraction,
  intervalsOverlap,
  isValidQuotePart,
  sumExceedsOne,
} from '../../common/fraction';
import { CreateDetentionDto } from './dto/create-detention.dto';
import { UpdateDetentionDto } from './dto/update-detention.dto';

@Injectable()
export class DetentionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(lotId: string, dto: CreateDetentionDto) {
    const nature = dto.natureDroit ?? NatureDroit.PLEINE_PROPRIETE;
    const dateDebut = new Date(dto.dateDebut);
    const dateFin = dto.dateFin ? new Date(dto.dateFin) : null;

    // Lot + syndic (via la copropriété) pour l'isolation RG-10.
    const lot = await this.prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true, copropriete: { select: { syndicId: true } } },
    });
    if (!lot) {
      throw new NotFoundException(`Lot ${lotId} introuvable`);
    }

    const personne = await this.prisma.personne.findUnique({
      where: { id: dto.personneId },
      select: { id: true, syndicId: true },
    });
    if (!personne) {
      throw new NotFoundException(`Personne ${dto.personneId} introuvable`);
    }

    // RG-10 : personne et lot du même syndic.
    if (personne.syndicId !== lot.copropriete.syndicId) {
      throw new BadRequestException(
        "La personne et le lot n'appartiennent pas au même syndic",
      );
    }

    // RG-11 : quote-part valide.
    if (!isValidQuotePart(dto.quotePartNum, dto.quotePartDen)) {
      throw new BadRequestException(
        'Quote-part invalide (attendu : entiers, 0 < num/den ≤ 1)',
      );
    }

    // RG-12 : dateFin strictement après dateDebut.
    if (dateFin && dateFin.getTime() <= dateDebut.getTime()) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }

    // RG-13 : somme des quote-parts de MÊME NATURE qui se chevauchent ≤ 1.
    await this.verifierSommeQuoteParts(
      lotId,
      nature,
      { num: dto.quotePartNum, den: dto.quotePartDen },
      dateDebut,
      dateFin,
    );

    return this.prisma.detentionPropriete.create({
      data: {
        lotId,
        personneId: dto.personneId,
        quotePartNum: dto.quotePartNum,
        quotePartDen: dto.quotePartDen,
        natureDroit: nature,
        dateDebut,
        dateFin,
      },
    });
  }

  findByLot(lotId: string, activesSeulement = false) {
    return this.prisma.detentionPropriete.findMany({
      where: {
        lotId,
        ...(activesSeulement ? { dateFin: null } : {}),
      },
      include: { personne: true },
      orderBy: { dateDebut: 'desc' },
    });
  }

  findByPersonne(personneId: string) {
    return this.prisma.detentionPropriete.findMany({
      where: { personneId },
      include: { lot: true },
      orderBy: { dateDebut: 'desc' },
    });
  }

  async update(id: string, dto: UpdateDetentionDto) {
    const detention = await this.prisma.detentionPropriete.findUnique({
      where: { id },
    });
    if (!detention) {
      throw new NotFoundException(`Détention ${id} introuvable`);
    }

    const num = dto.quotePartNum ?? detention.quotePartNum;
    const den = dto.quotePartDen ?? detention.quotePartDen;
    const dateFin = dto.dateFin ? new Date(dto.dateFin) : detention.dateFin;

    if (!isValidQuotePart(num, den)) {
      throw new BadRequestException('Quote-part invalide');
    }
    if (dateFin && dateFin.getTime() <= detention.dateDebut.getTime()) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }

    // Revérifie l'invariant de somme en excluant la détention courante.
    await this.verifierSommeQuoteParts(
      detention.lotId,
      detention.natureDroit,
      { num, den },
      detention.dateDebut,
      dateFin,
      id,
    );

    return this.prisma.detentionPropriete.update({
      where: { id },
      data: { quotePartNum: num, quotePartDen: den, dateFin },
    });
  }

  /**
   * RG-13 — vérifie que la somme des quote-parts des détentions de MÊME nature
   * de droit, qui chevauchent la période donnée, ne dépasse pas 1.
   */
  private async verifierSommeQuoteParts(
    lotId: string,
    nature: NatureDroit,
    nouvelle: Fraction,
    dateDebut: Date,
    dateFin: Date | null,
    exclureDetentionId?: string,
  ) {
    const existantes = await this.prisma.detentionPropriete.findMany({
      where: {
        lotId,
        natureDroit: nature,
        ...(exclureDetentionId ? { id: { not: exclureDetentionId } } : {}),
      },
      select: {
        quotePartNum: true,
        quotePartDen: true,
        dateDebut: true,
        dateFin: true,
      },
    });

    const chevauchantes = existantes.filter((d) =>
      intervalsOverlap(dateDebut, dateFin, d.dateDebut, d.dateFin),
    );

    const fractions: Fraction[] = [
      nouvelle,
      ...chevauchantes.map((d) => ({ num: d.quotePartNum, den: d.quotePartDen })),
    ];

    if (sumExceedsOne(fractions)) {
      throw new ConflictException(
        `La somme des quote-parts (${nature}) dépasserait 100 % sur cette période`,
      );
    }
  }
}
