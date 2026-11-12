import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoproprieteService } from '../patrimoine/copropriete/copropriete.service';
import { StockageService } from './stockage.service';
import {
  contenuConforme,
  extensionNormalisee,
  LIBELLE_FORMATS,
  mimeDeService,
  nomAffichageSur,
  TAILLE_MAX,
  typeDeclareAutorise,
} from './fichiers-autorises';

// Fichier téléversé, tel que fourni par Multer (évite la dépendance @types/multer).
export interface FichierUpload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

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
    if (fichier.size > TAILLE_MAX || fichier.buffer.length > TAILLE_MAX) {
      throw new BadRequestException('Fichier trop volumineux (max 15 Mo)');
    }
    if (
      !typeDeclareAutorise(fichier.originalname, fichier.mimetype) ||
      !contenuConforme(fichier.originalname, fichier.buffer)
    ) {
      throw new BadRequestException(`Format non autorisé : ${LIBELLE_FORMATS} uniquement`);
    }
    await this.coproprietes.ensureExists(coproprieteId);

    const nomOriginal = nomAffichageSur(fichier.originalname);
    const cle = await this.stockage.enregistrer(
      extensionNormalisee(nomOriginal),
      fichier.buffer,
    );
    return this.prisma.document.create({
      data: {
        syndicId,
        coproprieteId,
        nomOriginal,
        cheminStockage: cle,
        mimeType: mimeDeService(nomOriginal),
        taille: fichier.buffer.length,
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

  // Toujours filtré par syndic (défense en profondeur, en plus de TenantGuard).
  async findOne(syndicId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, syndicId } });
    if (!doc) {
      throw new NotFoundException(`Document ${id} introuvable`);
    }
    return doc;
  }

  // Renvoie les métadonnées + le flux de lecture pour le téléchargement.
  async pourTelechargement(syndicId: string, id: string) {
    const doc = await this.findOne(syndicId, id);
    if (!this.stockage.existe(doc.cheminStockage)) {
      throw new NotFoundException('Fichier introuvable sur le stockage');
    }
    return { doc, flux: this.stockage.flux(doc.cheminStockage) };
  }

  async remove(syndicId: string, id: string) {
    const doc = await this.findOne(syndicId, id);
    await this.prisma.document.delete({ where: { id } });
    await this.stockage.supprimer(doc.cheminStockage);
    return { id, supprime: true };
  }
}
