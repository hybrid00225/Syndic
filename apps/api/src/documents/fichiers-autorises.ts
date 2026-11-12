import { extname } from 'path';

// Types de fichiers acceptés : extension → types MIME admis + signature binaire.
// Les SVG/HTML sont exclus (exécution de script possible côté navigateur).
interface TypeFichier {
  mimes: string[];
  // Contrôle des premiers octets (null = texte brut, pas de signature).
  signature: ((b: Buffer) => boolean) | null;
}

const commencePar = (...octets: number[]) => (b: Buffer) =>
  b.length >= octets.length && octets.every((o, i) => b[i] === o);
const PDF = commencePar(0x25, 0x50, 0x44, 0x46); // %PDF
const PNG = commencePar(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const JPEG = commencePar(0xff, 0xd8, 0xff);
const WEBP = (b: Buffer) =>
  b.length >= 12 &&
  b.toString('ascii', 0, 4) === 'RIFF' &&
  b.toString('ascii', 8, 12) === 'WEBP';
const ZIP = commencePar(0x50, 0x4b, 0x03, 0x04); // docx/xlsx/pptx/odt/ods
const OLE = commencePar(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1); // doc/xls
const TEXTE = (b: Buffer) => !b.subarray(0, 8192).includes(0x00);

export const TYPES_AUTORISES: Record<string, TypeFichier> = {
  '.pdf': { mimes: ['application/pdf'], signature: PDF },
  '.png': { mimes: ['image/png'], signature: PNG },
  '.jpg': { mimes: ['image/jpeg'], signature: JPEG },
  '.jpeg': { mimes: ['image/jpeg'], signature: JPEG },
  '.webp': { mimes: ['image/webp'], signature: WEBP },
  '.doc': { mimes: ['application/msword'], signature: OLE },
  '.xls': { mimes: ['application/vnd.ms-excel'], signature: OLE },
  '.docx': {
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    signature: ZIP,
  },
  '.xlsx': {
    mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    signature: ZIP,
  },
  '.pptx': {
    mimes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    signature: ZIP,
  },
  '.odt': { mimes: ['application/vnd.oasis.opendocument.text'], signature: ZIP },
  '.ods': { mimes: ['application/vnd.oasis.opendocument.spreadsheet'], signature: ZIP },
  '.csv': { mimes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'], signature: TEXTE },
  '.txt': { mimes: ['text/plain'], signature: TEXTE },
};

export const TAILLE_MAX = 15 * 1024 * 1024; // 15 Mo
export const LIBELLE_FORMATS = 'PDF, images (PNG, JPEG, WebP), Word, Excel, PowerPoint, OpenDocument, CSV ou TXT';

export function extensionNormalisee(nom: string): string {
  return extname(nom).toLowerCase();
}

// Contrôle déclaratif (extension + type MIME annoncé), utilisable avant lecture.
export function typeDeclareAutorise(nom: string, mime: string): boolean {
  const t = TYPES_AUTORISES[extensionNormalisee(nom)];
  return !!t && t.mimes.includes(mime);
}

// Contrôle du contenu réel (signature binaire).
export function contenuConforme(nom: string, contenu: Buffer): boolean {
  const t = TYPES_AUTORISES[extensionNormalisee(nom)];
  if (!t) return false;
  return t.signature ? t.signature(contenu) : true;
}

// Type MIME servi au téléchargement : dérivé de l'extension (jamais du client).
export function mimeDeService(nom: string): string {
  const t = TYPES_AUTORISES[extensionNormalisee(nom)];
  return t ? t.mimes[0] : 'application/octet-stream';
}

// Nom d'affichage sûr : sans chemin, sans caractères de contrôle, borné.
export function nomAffichageSur(nom: string): string {
  const base = nom.split(/[\\/]/).pop() ?? 'fichier';
  // eslint-disable-next-line no-control-regex
  const propre = base.replace(/[\u0000-\u001f\u007f"<>|:*?]/g, '_').trim();
  return (propre || 'fichier').slice(0, 200);
}

// En-tête Content-Disposition (RFC 6266) : repli ASCII + nom UTF-8 encodé.
export function contentDisposition(nom: string): string {
  const sur = nomAffichageSur(nom);
  const ascii = sur.normalize('NFKD').replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(sur)}`;
}
