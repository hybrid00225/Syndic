import { randomUUID } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { extname, join } from 'path';
import { Injectable } from '@nestjs/common';

// Stockage de fichiers. MVP : disque local sous ./uploads. L'interface est
// volontairement minimale pour basculer vers S3/MinIO plus tard sans toucher
// aux appelants (on ne manipule qu'une `cle` opaque).
@Injectable()
export class StockageService {
  private readonly racine = join(process.cwd(), 'uploads');

  // Écrit le fichier et renvoie sa clé de stockage interne.
  async enregistrer(nomOriginal: string, contenu: Buffer): Promise<string> {
    await mkdir(this.racine, { recursive: true });
    const cle = `${randomUUID()}${extname(nomOriginal)}`;
    await writeFile(join(this.racine, cle), contenu);
    return cle;
  }

  chemin(cle: string): string {
    return join(this.racine, cle);
  }

  existe(cle: string): boolean {
    return existsSync(this.chemin(cle));
  }

  flux(cle: string) {
    return createReadStream(this.chemin(cle));
  }

  async supprimer(cle: string): Promise<void> {
    try {
      await unlink(this.chemin(cle));
    } catch {
      // Fichier déjà absent : on ignore (la ligne en base reste la source de vérité).
    }
  }
}
