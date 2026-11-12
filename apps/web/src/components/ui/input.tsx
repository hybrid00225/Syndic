'use client';

import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  useState,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Contrôle sobre : filet, focus = filet encre vert + anneau 1px (pas de halo).
export const controlCls =
  'w-full rounded-md border border-input bg-card px-3 text-sm transition-colors placeholder:text-muted-foreground/70 hover:border-foreground/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger';

const FieldCtx = createContext<{ id: string; describedBy?: string } | null>(null);

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, id, ...props }, ref) => {
    const field = useContext(FieldCtx);
    return (
      <input
        ref={ref}
        id={id ?? field?.id}
        aria-describedby={props['aria-describedby'] ?? field?.describedBy}
        className={cn('flex h-10', controlCls, className)}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

/** Mot de passe avec bouton « afficher / masquer ». */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn('pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, id, ...props }, ref) => {
  const field = useContext(FieldCtx);
  return (
    <textarea
      ref={ref}
      id={id ?? field?.id}
      aria-describedby={props['aria-describedby'] ?? field?.describedBy}
      className={cn('min-h-[88px] py-2', controlCls, className)}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

/** Identifiant du champ courant (pour lier un contrôle custom à son label). */
export function useFieldId() {
  return useContext(FieldCtx)?.id;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const field = useContext(FieldCtx);
  return (
    <label
      htmlFor={props.htmlFor ?? field?.id}
      className={cn('mb-1.5 block text-ui font-medium text-foreground', className)}
      {...props}
    />
  );
}

/**
 * Champ complet : label lié (htmlFor/id auto), aide, erreur.
 * <Field label="Nom" hint="…"><Input … /></Field>
 */
export function Field({
  label,
  hint,
  error,
  required,
  action,
  className,
  children,
}: {
  label: React.ReactNode;
  /** Élément aligné à droite du libellé (ex. « Mot de passe oublié ? »). */
  action?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const hintId = hint || error ? `${id}-desc` : undefined;
  return (
    <FieldCtx.Provider value={{ id, describedBy: hintId }}>
      <div className={className}>
        <div className="flex items-baseline justify-between gap-3">
          <Label>
            {label}
            {required && (
              <span aria-hidden className="ml-0.5 text-danger">
                *
              </span>
            )}
          </Label>
          {action && <div className="mb-1.5 text-ui">{action}</div>}
        </div>
        {isValidElement(children) && error
          ? cloneElement(children as React.ReactElement<{ 'aria-invalid'?: boolean }>, {
              'aria-invalid': true,
            })
          : children}
        {(error || hint) && (
          <p
            id={hintId}
            className={cn('mt-1.5 text-2xs', error ? 'text-danger' : 'text-muted-foreground')}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    </FieldCtx.Provider>
  );
}
