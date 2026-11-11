'use client';

import { useEffect, useState } from 'react';

// Source unique du thème (topbar + menu utilisateur partagent cet état).
export type ThemeMode = 'light' | 'dark' | 'system';

const KEY = 'syndic_alpha_theme';
const EVENT = 'syndic-theme-change';

function read(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function apply(mode: ThemeMode) {
  const dark =
    mode === 'dark' ||
    (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function setTheme(mode: ThemeMode) {
  try {
    if (mode === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    /* stockage indisponible */
  }
  apply(mode);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: mode }));
}

export function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    setMode(read());
    const onChange = (e: Event) => setMode((e as CustomEvent<ThemeMode>).detail);
    // Suit le système en direct quand le mode est « Système ».
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onSystem = () => read() === 'system' && apply('system');
    window.addEventListener(EVENT, onChange);
    mq.addEventListener('change', onSystem);
    return () => {
      window.removeEventListener(EVENT, onChange);
      mq.removeEventListener('change', onSystem);
    };
  }, []);

  return [mode, setTheme];
}
