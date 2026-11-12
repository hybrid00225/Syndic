import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoproprieteService } from '../patrimoine/copropriete/copropriete.service';
import { StockageService } from './stockage.service';

// Fichier téléversé, tel que fourni par Multer (évite la dépendance @types/multer).
export interface FichierUpload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Types de fichiers acceptés et taille max (garde-fous simples).
const MIME_AUTORISES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];
const TAILLE_MAX = 15 * 1024 * 1024; // 15 Mo

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
    private readonly stockage: StockageService,
  ) {}

  async upload(
    syndicId: string,
    coproprieteId: string,
    fichier?: FichierUpload,
  ) {
    if (!fichier) {
      throw new BadRequestException('Aucun fichier reçu');
    }
    if (!MIME_AUTORISES.includes(fichier.mimetype)) {
      throw new BadRequestException(
        'Format non autorisé : PDF, PNG, JPEG ou WebP uniquement',
      );
    }
    if (fichier.size > TAILLE_MAX) {
      throw new BadRequestException('Fichier trop volumineux (max 15 Mo)');
    }
    await this.coproprietes.ensureExists(coproprieteId);

    const cle = await this.stockage.enregistrer(
      fichier.originalname,
      fichier.buffer,
    );
    return this.prisma.document.create({
      data: {
        syndicId,
        coproprieteId,
        nomOriginal: fichier.originalname,
        cheminStockage: cle,
        mimeType: fichier.mimetype,
        taille: fichier.size,
      },
      select: {
        id: true,
        nomOriginal: true,
        mimeType: true,
        taille: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document ${id} introuvable`);
    }
    return doc;
  }

  // Renvoie les métadonnées + le flux de lecture pour le téléchargement.
  async pourTelechargement(id: string) {
    const doc = await this.findOne(id);
    if (!this.stockage.existe(doc.cheminStockage)) {
      throw new NotFoundException('Fichier introuvable sur le stockage');
    }
    return { doc, flux: this.stockage.flux(doc.cheminStockage) };
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    await this.prisma.document.delete({ where: { id } });
    await this.stockage.supprimer(doc.cheminStockage);
    return { id, supprime: true };
  }
}
