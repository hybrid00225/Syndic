import { randomUUID } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { Injectable } from '@nestjs/common';

// Clé de stockage : UUID + extension en minuscules, générés côté serveur.
const CLE_VALIDE = /^[0-9a-f-]{36}(\.[A-Za-z0-9]{1,8})?$/;

// Stockage de fichiers. MVP : disque local sous ./uploads (hors de toute racine
// servie statiquement). L'interface est volontairement minimale pour basculer
// vers S3/MinIO plus tard sans toucher aux appelants (on ne manipule qu'une
// `cle` opaque, jamais un chemin fourni par le client).
@Injectable()
export class StockageService {
  private readonly racine = resolve(process.cwd(), 'uploads');

  // Écrit le fichier et renvoie sa clé de stockage interne (nom aléatoire).
  async enregistrer(extension: string, contenu: Buffer): Promise<string> {
    await mkdir(this.racine, { recursive: true, mode: 0o750 });
    const ext = /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : '';
    const cle = `${randomUUID()}${ext}`;
    await writeFile(this.chemin(cle), contenu, { mode: 0o640, flag: 'wx' });
    return cle;
  }

  // Résout la clé en chemin absolu, en refusant toute sortie du répertoire
  // (protection path traversal, même si la base était altérée).
  chemin(cle: string): string {
    if (!CLE_VALIDE.test(cle)) {
      throw new Error(`Clé de stockage invalide : ${cle}`);
    }
    const chemin = resolve(join(this.racine, cle));
    if (!chemin.startsWith(this.racine + sep)) {
      throw new Error(`Clé de stockage hors du répertoire : ${cle}`);
    }
    return chemin;
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
