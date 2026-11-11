'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AlertTriangle, ArrowRight, Info, Trash2, Check } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

type Tone = 'danger' | 'primary' | 'warning';

export interface ConfirmOptions {
  title: string;
  /** Décrit l'impact de l'action. */
  description: string;
  /** Ce qui se passe ensuite, si pertinent. */
  nextAction?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
}

type Ctx = (o: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<Ctx | null>(null);

const toneMeta: Record<Tone, { icon: typeof Info; chip: string; btn: 'danger' | 'primary' }> =
  {
    danger: { icon: Trash2, chip: 'bg-danger/12 text-danger', btn: 'danger' },
    warning: {
      icon: AlertTriangle,
      chip: 'bg-warning/15 text-warning',
      btn: 'primary',
    },
    primary: { icon: Check, chip: 'bg-primary/12 text-primary', btn: 'primary' },
  };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback<Ctx>(
    (opts) =>
      new Promise<boolean>((resolve) => setState({ opts, resolve })),
    [],
  );

  const close = useCallback(
    (v: boolean) => {
      state?.resolve(v);
      setState(null);
    },
    [state],
  );

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state, close]);

  const meta = state ? toneMeta[state.opts.tone ?? 'primary'] : null;
  const Icon = meta?.icon ?? Info;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && meta && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-md animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal
          >
            <div className="flex items-start gap-3.5">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  meta.chip,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight">
                  {state.opts.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state.opts.description}
                </p>
                {state.opts.nextAction && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="font-medium">Ensuite : </span>
                      {state.opts.nextAction}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => close(false)}>
                {state.opts.cancelLabel ?? 'Annuler'}
              </Button>
              <Button variant={meta.btn} onClick={() => close(true)}>
                {state.opts.confirmLabel ?? 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Ctx {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm doit être utilisé dans ConfirmProvider');
  return ctx;
}
