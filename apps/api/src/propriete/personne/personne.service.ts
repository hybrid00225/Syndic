import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isEmail } from 'class-validator';
import { ContactType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePersonneDto } from './dto/create-personne.dto';
import { UpdatePersonneDto } from './dto/update-personne.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class PersonneService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePersonneDto) {
    const syndic = await this.prisma.syndic.findUnique({
      where: { id: dto.syndicId },
      select: { id: true },
    });
    if (!syndic) {
      throw new NotFoundException(`Syndic ${dto.syndicId} introuvable`);
    }
    (dto.contacts ?? []).forEach((c) => this.validerContact(c));

    return this.prisma.personne.create({
      data: {
        syndicId: dto.syndicId,
        type: dto.type,
        nom: dto.nom,
        prenom: dto.prenom,
        contacts: dto.contacts?.length
          ? { create: dto.contacts.map((c) => ({ ...c })) }
          : undefined,
      },
      include: { contacts: true },
    });
  }

  findAll(syndicId?: string) {
    return this.prisma.personne.findMany({
      where: syndicId ? { syndicId } : undefined,
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const personne = await this.prisma.personne.findUnique({
      where: { id },
      include: { contacts: true, detentions: true },
    });
    if (!personne) {
      throw new NotFoundException(`Personne ${id} introuvable`);
    }
    return personne;
  }

  async update(id: string, dto: UpdatePersonneDto) {
    await this.ensureExists(id);
    return this.prisma.personne.update({ where: { id }, data: { ...dto } });
  }

  async addContact(personneId: string, dto: CreateContactDto) {
    await this.ensureExists(personneId);
    this.validerContact(dto);
    return this.prisma.contact.create({ data: { personneId, ...dto } });
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
