'use client';

import { useEffect, useState } from 'react';

/**
 * Préférences d'affichage (par navigateur). Appliquées sur <html> via des
 * attributs data-* que globals.css traduit en variables CSS ; le script
 * anti-flash du layout racine les applique avant le premier rendu.
 */
export interface Preferences {
  /** Disposition de la navigation (sur grand écran ; mobile = tiroir). */
  layout: 'sidebar' | 'topnav';
  /** Teinte de la navigation (menu latéral ou barre). */
  navTone: 'default' | 'card' | 'forest' | 'ink';
  /** Police du texte. */
  font: 'hanken' | 'inter' | 'manrope' | 'system';
  /** Police des titres : serif éditoriale ou identique au texte. */
  display: 'serif' | 'sans';
  /** Arrondis des surfaces et contrôles. */
  radius: 'sharp' | 'default' | 'round';
}

const DEFAULT_PREFERENCES: Preferences = {
  layout: 'sidebar',
  navTone: 'default',
  font: 'hanken',
  display: 'serif',
  radius: 'default',
};

// Valeurs admises (le stockage local peut contenir n'importe quoi).
const ALLOWED: { [K in keyof Preferences]: readonly Preferences[K][] } = {
  layout: ['sidebar', 'topnav'],
  navTone: ['default', 'card', 'forest', 'ink'],
  font: ['hanken', 'inter', 'manrope', 'system'],
  display: ['serif', 'sans'],
  radius: ['sharp', 'default', 'round'],
};

const PREFERENCES_KEY = 'syndic_alpha_prefs';
const EVENT = 'syndic-prefs-change';

function read(): Preferences {
  const prefs = { ...DEFAULT_PREFERENCES };
  try {
    const raw = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}') as Record<string, unknown>;
    for (const key of Object.keys(ALLOWED) as (keyof Preferences)[]) {
      const v = raw[key];
      if ((ALLOWED[key] as readonly unknown[]).includes(v)) {
        (prefs as Record<keyof Preferences, unknown>)[key] = v;
      }
    }
  } catch {
    /* stockage indisponible ou corrompu : valeurs par défaut */
  }
  return prefs;
}

function apply(p: Preferences) {
  const el = document.documentElement;
  el.dataset.navTone = p.navTone;
  el.dataset.font = p.font;
  el.dataset.display = p.display;
  el.dataset.radius = p.radius;
}

function save(p: Preferences) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(p));
  } catch {
    /* stockage indisponible */
  }
  apply(p);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: p }));
}

/** Préférences courantes + mise à jour partielle + réinitialisation. */
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setPrefs(read());
    const onChange = (e: Event) => setPrefs((e as CustomEvent<Preferences>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  return {
    prefs,
    update: (patch: Partial<Preferences>) => save({ ...read(), ...patch }),
    reset: () => save({ ...DEFAULT_PREFERENCES }),
  };
}
