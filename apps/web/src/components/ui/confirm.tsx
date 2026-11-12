'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Button } from './button';

type Tone = 'danger' | 'primary' | 'warning';

export interface ConfirmOptions {
  title: string;
  /** Décrit l'impact de l'action. */
  description: string;
  /** Ce qui se passe ensuite, si pertinent. */
  nextAction?: string;
  confirmLabel?: string;
  /** null = pas de bouton d'annulation (simple information). */
  cancelLabel?: string | null;
  tone?: Tone;
}

type Ctx = (o: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<Ctx | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback<Ctx>(
    (opts) => new Promise<boolean>((resolve) => setState({ opts, resolve })),
    [],
  );

  const close = useCallback(
    (v: boolean) => {
      state?.resolve(v);
      setState(null);
    },
    [state],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <Dialog opts={state.opts} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

function Dialog({ opts, onClose }: { opts: ConfirmOptions; onClose: (v: boolean) => void }) {
  const id = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const tone = opts.tone ?? 'primary';

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // Action destructive : le focus part sur « Annuler » (Entrée ne détruit rien par accident).
    (tone === 'danger' && cancelRef.current ? cancelRef.current : okRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(false);
      }
      // Piège de focus : Tab reste dans la boîte.
      if (e.key === 'Tab' && boxRef.current) {
        const els = boxRef.current.querySelectorAll<HTMLElement>('button');
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose, tone]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/30 p-4"
      onMouseDown={() => onClose(false)}
    >
      <div
        ref={boxRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={`${id}-d`}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-pop-in overflow-hidden rounded-lg border border-border bg-card shadow-lift"
      >
        <div className="p-6">
          <h2 id={`${id}-t`} className="font-display text-xl font-medium">
            {opts.title}
          </h2>
          <p id={`${id}-d`} className="mt-2 text-sm text-muted-foreground">
            {opts.description}
          </p>
          {opts.nextAction && (
            <p className="mt-4 rounded-md bg-muted/60 px-3 py-2 text-sm">
              <span className="font-medium">Ensuite — </span>
              {opts.nextAction}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-muted/40 px-6 py-3">
          {opts.cancelLabel !== null && (
            <Button ref={cancelRef} variant="secondary" onClick={() => onClose(false)}>
              {opts.cancelLabel ?? 'Annuler'}
            </Button>
          )}
          <Button
            ref={okRef}
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => onClose(true)}
          >
            {opts.confirmLabel ?? 'Confirmer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm(): Ctx {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm doit être utilisé dans ConfirmProvider');
  return ctx;
}

/** Message d'information (un seul bouton). */
export function useAlert() {
  const confirm = useConfirm();
  return (title: string, description: string, tone: Tone = 'warning') =>
    confirm({ title, description, tone, cancelLabel: null, confirmLabel: 'Compris' });
}
