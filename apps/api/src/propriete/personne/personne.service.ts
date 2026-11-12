import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isEmail } from 'class-validator';
import { ContactType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePersonneDto } from './dto/create-personne.dto';
import { UpdatePersonneDto } from './dto/update-personne.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class PersonneService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePersonneDto, syndicId: string) {
    (dto.contacts ?? []).forEach((c) => this.validerContact(c));

    return this.prisma.personne.create({
      data: {
        syndicId,
        type: dto.type,
        nom: dto.nom,
        prenom: dto.prenom,
        statut: dto.statut,
        modeNotification: dto.modeNotification,
        representantId: dto.representantId,
        natureRepresentation: dto.natureRepresentation,
        contacts: dto.contacts?.length
          ? { create: dto.contacts.map((c) => ({ ...c })) }
          : undefined,
      },
      include: { contacts: true },
    });
  }

  // Règle 3 : les copropriétaires d'UNE copropriété = les personnes détenant au
  // moins un lot de cette copropriété. On renvoie leurs détentions dans cette
  // copropriété (lot, quote-part, nature, dates), en cours par défaut.
  async coproprietairesDeCopropriete(
    coproprieteId: string,
    inclureHistorique = false,
  ) {
    const detentionWhere = {
      lot: { coproprieteId },
      ...(inclureHistorique ? {} : { dateFin: null }),
    };
    const personnes = await this.prisma.personne.findMany({
      where: { detentions: { some: detentionWhere } },
      include: {
        contacts: true,
        representant: { select: { id: true, nom: true, prenom: true, type: true } },
        detentions: {
          where: detentionWhere,
          include: {
            lot: { select: { id: true, reference: true, type: true } },
          },
          orderBy: { dateDebut: 'desc' },
        },
      },
      orderBy: { nom: 'asc' },
    });
    return personnes;
  }

  findAll(syndicId?: string) {
    return this.prisma.personne.findMany({
      where: syndicId ? { syndicId } : undefined,
      include: {
        contacts: true,
        _count: { select: { detentions: true } },
      },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const personne = await this.prisma.personne.findUnique({
      where: { id },
      include: {
        contacts: true,
        representant: {
          select: { id: true, nom: true, prenom: true, type: true },
        },
        represente: { select: { id: true, nom: true, prenom: true, type: true } },
        detentions: {
          include: {
            lot: {
              select: {
                id: true,
                reference: true,
                coproprieteId: true,
                copropriete: { select: { nom: true } },
              },
            },
          },
          orderBy: { dateDebut: 'desc' },
        },
      },
    });
    if (!personne) {
      throw new NotFoundException(`Personne ${id} introuvable`);
    }
    return personne;
  }

  // Met à jour l'identité et, si fournis, remplace les contacts.
  async update(id: string, dto: UpdatePersonneDto) {
    await this.ensureExists(id);
    (dto.contacts ?? []).forEach((c) => this.validerContact(c));
    const { contacts, ...identite } = dto;

    if (contacts) {
      return this.prisma.$transaction(async (tx) => {
        await tx.contact.deleteMany({ where: { personneId: id } });
        return tx.personne.update({
          where: { id },
          data: {
            ...identite,
            contacts: { create: contacts.map((c) => ({ ...c })) },
          },
          include: { contacts: true },
        });
      });
    }
    return this.prisma.personne.update({
      where: { id },
      data: { ...identite },
      include: { contacts: true },
    });
  }

  async addContact(personneId: string, dto: CreateContactDto) {
    await this.ensureExists(personneId);
    this.validerContact(dto);
    return this.prisma.contact.create({ data: { personneId, ...dto } });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.contact.deleteMany({ where: { personneId: id } });
        await tx.personne.delete({ where: { id } });
      });
      return { id, supprime: true };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'Ce copropriétaire détient des lots ou est lié à des paiements : retirez ces liens avant de le supprimer.',
        );
      }
      throw e;
    }
  }

  async ensureExists(id: string) {
    const exists = await this.prisma.personne.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Personne ${id} introuvable`);
    }
  }

  // RG-15 : un contact EMAIL doit être un email valide.
  private validerContact(c: CreateContactDto) {
    if (c.type === ContactType.EMAIL && !isEmail(c.valeur)) {
      throw new BadRequestException(`Email invalide : « ${c.valeur} »`);
    }
  }
}
