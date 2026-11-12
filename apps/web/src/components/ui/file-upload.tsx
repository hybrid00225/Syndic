'use client';

import { useId, useRef, useState } from 'react';
import { Eye, FileText, Image as ImageIcon, Paperclip, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './icon-button';
import { useFieldId } from './input';
import { useDocumentPreview } from './document-preview';

/*
 * Téléversement de fichier, unique pour toute l'application : glisser-déposer
 * ou parcourir, contrôle du format et de la taille AVANT envoi (mêmes règles
 * que l'API : apps/api/src/documents/fichiers-autorises.ts), aperçu du fichier
 * choisi et rappel du fichier déjà enregistré.
 */

/** Taille maximale acceptée par l'API. */
const TAILLE_MAX = 15 * 1024 * 1024;

/** Jeux de formats (extensions) prêts à l'emploi. */
export const FORMATS = {
  /** Pièces justificatives : PDF et images. */
  pdfImages: ['.pdf', '.png', '.jpg', '.jpeg', '.webp'],
  /** Tous les documents acceptés par l'API. */
  documents: ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx', '.xls', '.xlsx', '.pptx', '.odt', '.ods', '.csv', '.txt'],
} as const;

const LIBELLES: Record<string, string> = {
  '.pdf': 'PDF',
  '.png': 'PNG',
  '.jpg': 'JPEG',
  '.jpeg': 'JPEG',
  '.webp': 'WebP',
  '.doc': 'Word',
  '.docx': 'Word',
  '.xls': 'Excel',
  '.xlsx': 'Excel',
  '.pptx': 'PowerPoint',
  '.odt': 'OpenDocument',
  '.ods': 'OpenDocument',
  '.csv': 'CSV',
  '.txt': 'TXT',
};

export function tailleLisible(o: number) {
  if (o < 1024 * 1024) return `${Math.max(1, Math.round(o / 1024))} Ko`;
  return `${(o / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

const extension = (nom: string) => {
  const i = nom.lastIndexOf('.');
  return i < 0 ? '' : nom.slice(i).toLowerCase();
};

const APERCU = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);

export function FileUpload({
  value,
  onChange,
  formats = FORMATS.pdfImages,
  existing,
  disabled,
  className,
}: {
  /** Fichier choisi (pas encore envoyé). */
  value: File | null;
  onChange: (file: File | null) => void;
  /** Extensions acceptées (voir FORMATS). */
  formats?: readonly string[];
  /** Nom du fichier déjà enregistré (conservé tant qu'aucun autre n'est choisi). */
  existing?: string | null;
  disabled?: boolean;
  className?: string;
}) {
  const fieldId = useFieldId();
  const autoId = useId();
  const id = fieldId ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useDocumentPreview();
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const libelleFormats = [...new Set(formats.map((f) => LIBELLES[f] ?? f.slice(1).toUpperCase()))].join(', ');

  const choisir = (file: File | undefined) => {
    if (!file) return;
    if (!formats.includes(extension(file.name))) {
      setError(`Format non accepté. Formats possibles : ${libelleFormats}.`);
      return;
    }
    if (file.size > TAILLE_MAX) {
      setError(`Fichier trop volumineux (${tailleLisible(file.size)}). Maximum : ${tailleLisible(TAILLE_MAX)}.`);
      return;
    }
    if (file.size === 0) {
      setError('Ce fichier est vide.');
      return;
    }
    setError(null);
    onChange(file);
  };

  const retirer = () => {
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const ext = value ? extension(value.name) : '';
  const Icon = value && ext !== '.pdf' && APERCU.has(ext) ? ImageIcon : FileText;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={formats.join(',')}
        disabled={disabled}
        className="peer sr-only"
        onChange={(e) => choisir(e.target.files?.[0])}
      />

      {value ? (
        // Fichier choisi : carte avec taille, aperçu et retrait.
        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon aria-hidden className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-ui font-medium">{value.name}</p>
            <p className="text-2xs text-muted-foreground">
              {tailleLisible(value.size)}
              {existing ? ` · remplacera « ${existing} »` : ''}
            </p>
          </div>
          {APERCU.has(ext) && (
            <IconButton
              label="Aperçu"
              icon={Eye}
              size="sm"
              onClick={() => preview({ title: value.name, load: async () => ({ blob: value, filename: value.name }) })}
            />
          )}
          <IconButton label="Retirer le fichier" icon={X} size="sm" tone="danger" onClick={retirer} disabled={disabled} />
        </div>
      ) : (
        // Zone de dépôt (clic ou glisser-déposer).
        <label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (!disabled) choisir(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-5 text-center transition-colors',
            over ? 'border-primary bg-primary/5' : 'border-input bg-card hover:border-foreground/30 hover:bg-muted/40',
            error && 'border-danger',
            disabled && 'pointer-events-none opacity-50',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
          )}
        >
          <UploadCloud aria-hidden className={cn('h-6 w-6', over ? 'text-primary' : 'text-muted-foreground')} />
          <span className="text-ui">
            <span className="font-medium text-primary">Choisir un fichier</span>
            <span className="text-muted-foreground"> ou le glisser ici</span>
          </span>
          <span className="text-2xs text-muted-foreground">
            {libelleFormats} · {tailleLisible(TAILLE_MAX)} max
          </span>
          {existing && (
            <span className="mt-1 inline-flex max-w-full items-center gap-1.5 text-2xs text-muted-foreground">
              <Paperclip aria-hidden className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Actuel : <span className="font-medium text-foreground">{existing}</span>
              </span>
            </span>
          )}
        </label>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-2xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
