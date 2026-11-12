'use client';

import { Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/lib/theme';
import { usePreferences, type Preferences } from '@/lib/preferences';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Option<V extends string> = { value: V; label: string; preview?: React.ReactNode };

/** Panneau « Paramètres d'affichage » (tiroir à droite), ouvert depuis la barre du haut. */
export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [theme, setTheme] = useTheme();
  const { prefs, update, reset } = usePreferences();

  const set =
    <K extends keyof Preferences>(key: K) =>
    (value: Preferences[K]) =>
      update({ [key]: value } as Partial<Preferences>);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Personnalisation"
      title="Paramètres d’affichage"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-2xs text-muted-foreground">Enregistrés sur cet appareil.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              reset();
              setTheme('system');
            }}
          >
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        </div>
      }
    >
      <div className="space-y-7">
        <Group<ThemeMode>
          title="Mode"
          value={theme}
          onChange={setTheme}
          columns={3}
          options={[
            { value: 'light', label: 'Clair', preview: <Sun aria-hidden className="h-4 w-4" /> },
            { value: 'dark', label: 'Sombre', preview: <Moon aria-hidden className="h-4 w-4" /> },
            { value: 'system', label: 'Système', preview: <Monitor aria-hidden className="h-4 w-4" /> },
          ]}
        />

        <Group<Preferences['layout']>
          title="Disposition du menu"
          hint="Sur mobile, le menu s’ouvre toujours en tiroir."
          value={prefs.layout}
          onChange={set('layout')}
          columns={2}
          options={[
            { value: 'sidebar', label: 'Menu latéral', preview: <LayoutPreview kind="sidebar" /> },
            { value: 'topnav', label: 'Barre de navigation', preview: <LayoutPreview kind="topnav" /> },
          ]}
        />

        <Group<Preferences['navTone']>
          title="Couleur du menu"
          value={prefs.navTone}
          onChange={set('navTone')}
          columns={4}
          options={[
            { value: 'default', label: 'Os', preview: <Swatch className="bg-background" /> },
            { value: 'card', label: 'Blanc', preview: <Swatch className="bg-card" /> },
            { value: 'forest', label: 'Forêt', preview: <Swatch className="bg-[hsl(160_48%_19%)]" /> },
            { value: 'ink', label: 'Encre', preview: <Swatch className="bg-[hsl(30_12%_10%)]" /> },
          ]}
        />

        <Group<Preferences['font']>
          title="Police du texte"
          value={prefs.font}
          onChange={set('font')}
          columns={2}
          options={[
            { value: 'hanken', label: 'Hanken Grotesk', preview: <FontPreview family="'Hanken Grotesk Variable'" /> },
            { value: 'inter', label: 'Inter', preview: <FontPreview family="'Inter Variable'" /> },
            { value: 'manrope', label: 'Manrope', preview: <FontPreview family="'Manrope Variable'" /> },
            { value: 'system', label: 'Système', preview: <FontPreview family="system-ui" /> },
          ]}
        />

        <Group<Preferences['display']>
          title="Police des titres"
          value={prefs.display}
          onChange={set('display')}
          columns={2}
          options={[
            { value: 'serif', label: 'Éditoriale', preview: <FontPreview family="'Fraunces Variable'" sample="Titre" /> },
            { value: 'sans', label: 'Comme le texte', preview: <FontPreview family="var(--font-sans)" sample="Titre" /> },
          ]}
        />

        <Group<Preferences['radius']>
          title="Arrondis"
          value={prefs.radius}
          onChange={set('radius')}
          columns={3}
          options={[
            { value: 'sharp', label: 'Nets', preview: <RadiusPreview radius="4px" /> },
            { value: 'default', label: 'Standard', preview: <RadiusPreview radius="7px" /> },
            { value: 'round', label: 'Arrondis', preview: <RadiusPreview radius="11px" /> },
          ]}
        />
      </div>
    </Sheet>
  );
}

/** Groupe de choix exclusifs présentés en cartes (role="radiogroup"). */
function Group<V extends string>({
  title,
  hint,
  value,
  onChange,
  options,
  columns,
}: {
  title: string;
  hint?: string;
  value: V;
  onChange: (v: V) => void;
  options: Option<V>[];
  columns: 2 | 3 | 4;
}) {
  return (
    <fieldset>
      <legend className="text-ui font-semibold">{title}</legend>
      {hint && <p className="mt-0.5 text-2xs text-muted-foreground">{hint}</p>}
      <div
        role="radiogroup"
        aria-label={title}
        className={cn(
          'mt-2.5 grid gap-2',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3',
          columns === 4 && 'grid-cols-4',
        )}
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={cn(
                'flex min-w-0 flex-col items-center gap-2 rounded-md border px-2 py-2.5 text-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-primary bg-primary/5 font-medium text-foreground ring-1 ring-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )}
            >
              {o.preview}
              <span className="max-w-full truncate">{o.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Swatch({ className }: { className: string }) {
  return <span aria-hidden className={cn('h-6 w-6 rounded-full border border-border', className)} />;
}

function FontPreview({ family, sample = 'Aa' }: { family: string; sample?: string }) {
  return (
    <span aria-hidden className="text-lg leading-none text-foreground" style={{ fontFamily: family }}>
      {sample}
    </span>
  );
}

function RadiusPreview({ radius }: { radius: string }) {
  return (
    <span
      aria-hidden
      className="h-6 w-9 border-2 border-foreground/60 bg-muted"
      style={{ borderRadius: radius }}
    />
  );
}

/** Schéma miniature de la disposition (menu latéral ou barre). */
function LayoutPreview({ kind }: { kind: 'sidebar' | 'topnav' }) {
  return (
    <span aria-hidden className="flex h-12 w-full max-w-[96px] overflow-hidden rounded-sm border border-border bg-background">
      {kind === 'sidebar' ? (
        <>
          <span className="w-1/4 border-r border-border bg-muted" />
          <span className="flex-1 space-y-1 p-1.5">
            <span className="block h-1 w-3/4 rounded-full bg-muted-foreground/30" />
            <span className="block h-1 w-1/2 rounded-full bg-muted-foreground/20" />
          </span>
        </>
      ) : (
        <span className="flex flex-1 flex-col">
          <span className="h-1/4 border-b border-border bg-muted" />
          <span className="flex-1 space-y-1 p-1.5">
            <span className="block h-1 w-3/4 rounded-full bg-muted-foreground/30" />
            <span className="block h-1 w-1/2 rounded-full bg-muted-foreground/20" />
          </span>
        </span>
      )}
    </span>
  );
}
