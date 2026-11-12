'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, FileWarning, Printer } from 'lucide-react';
import type { GeneratedDocument } from '@/lib/pdf';
import { Modal } from './modal';
import { Button } from './button';
import { Alert } from './alert';
import { BrandLoader } from './spinner';

export interface PreviewRequest {
  title: string;
  description?: string;
  /** Produit le document : PDF généré (service lib/pdf) ou fichier téléversé (fetchDocument). */
  load: () => Promise<GeneratedDocument>;
}

type Ctx = (req: PreviewRequest) => void;
const PreviewContext = createContext<Ctx | null>(null);

// Rendus dans l'aperçu. Tout le reste est proposé au téléchargement uniquement
// (jamais HTML/SVG : un blob: hérite de l'origine de l'application).
const PDF = 'application/pdf';
const IMAGES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

/** Fournit `useDocumentPreview()` à toute l'application (une seule modale). */
export function DocumentPreviewProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<PreviewRequest | null>(null);
  const open = useCallback<Ctx>((req) => setRequest(req), []);
  return (
    <PreviewContext.Provider value={open}>
      {children}
      {request && <DocumentPreview request={request} onClose={() => setRequest(null)} />}
    </PreviewContext.Provider>
  );
}

/** Ouvre l'aperçu d'un document (avant impression ou téléchargement). */
export function useDocumentPreview(): Ctx {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error('useDocumentPreview doit être utilisé dans DocumentPreviewProvider');
  return ctx;
}

function DocumentPreview({ request, onClose }: { request: PreviewRequest; onClose: () => void }) {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; doc: GeneratedDocument; url: string }
  >({ status: 'loading' });
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    request
      .load()
      .then((doc) => {
        if (cancelled) return;
        url = URL.createObjectURL(doc.blob);
        setState({ status: 'ready', doc, url });
      })
      .catch((e) => {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : 'Document indisponible.' });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [request]);

  const ready = state.status === 'ready' ? state : null;
  const type = ready?.doc.blob.type ?? '';
  const isPdf = type === PDF;
  const isImage = IMAGES.has(type);

  const download = () => {
    if (!ready) return;
    const a = document.createElement('a');
    a.href = ready.url;
    a.download = ready.doc.filename;
    a.rel = 'noopener';
    a.click();
  };

  const print = () => {
    const win = frameRef.current?.contentWindow;
    try {
      win?.focus();
      win?.print();
    } catch {
      // Visionneuse PDF qui refuse l'impression depuis un cadre : onglet dédié.
      if (ready) window.open(ready.url, '_blank', 'noopener');
    }
  };

  return (
    <Modal
      size="full"
      title={request.title}
      description={request.description ?? ready?.doc.filename}
      onClose={onClose}
      bodyClassName="flex p-0 overflow-hidden bg-muted/40"
      footer={
        <>
          {ready && (isPdf || isImage) && (
            <Button variant="ghost" className="mr-auto" onClick={() => window.open(ready.url, '_blank', 'noopener')}>
              <ExternalLink aria-hidden className="h-4 w-4" /> Ouvrir dans un onglet
            </Button>
          )}
          <Button variant="secondary" onClick={download} disabled={!ready}>
            <Download aria-hidden className="h-4 w-4" /> Télécharger
          </Button>
          <Button onClick={print} disabled={!ready || !(isPdf || isImage)}>
            <Printer aria-hidden className="h-4 w-4" /> Imprimer
          </Button>
        </>
      }
    >
      {state.status === 'loading' && (
        <div role="status" className="m-auto flex flex-col items-center gap-3 text-ui text-muted-foreground">
          <BrandLoader />
          Préparation du document…
        </div>
      )}
      {state.status === 'error' && (
        <div className="m-auto w-full max-w-md p-6">
          <Alert tone="danger">{state.message}</Alert>
        </div>
      )}
      {ready &&
        (isPdf || isImage ? (
          <iframe
            ref={frameRef}
            src={ready.url}
            title={`Aperçu : ${request.title}`}
            className="h-full w-full flex-1 border-0 bg-card"
          />
        ) : (
          <div className="m-auto flex max-w-sm flex-col items-center gap-3 p-6 text-center">
            <FileWarning aria-hidden className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Aperçu indisponible pour ce type de fichier</p>
            <p className="text-ui text-muted-foreground">
              {ready.doc.filename} peut être téléchargé puis ouvert avec l’application adaptée.
            </p>
          </div>
        ))}
    </Modal>
  );
}
