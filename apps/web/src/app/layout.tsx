import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/query';

export const metadata: Metadata = {
  title: { default: 'Syndic Alpha', template: '%s · Syndic Alpha' },
  description: 'Gestion de syndic de copropriété',
  applicationName: 'Syndic Alpha',
  manifest: '/manifest.webmanifest',
  // Favicon : marque verte forêt sur onglet clair, vert clair sur onglet sombre.
  icons: {
    icon: [
      { url: '/icons/favicon-light.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: light)' },
      { url: '/icons/favicon-dark.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
      { url: '/icons/favicon-32-light.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icons/favicon-32-dark.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: dark)' },
      { url: '/icons/favicon-16-light.png', sizes: '16x16', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icons/favicon-16-dark.png', sizes: '16x16', type: 'image/png', media: '(prefers-color-scheme: dark)' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  // Espace privé : ne pas indexer.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#131210' },
  ],
};

// Applique le thème et les préférences d'affichage avant le rendu (évite le
// flash). Valeurs filtrées : seules les options connues sont appliquées
// (même liste que lib/preferences.ts).
const themeScript = `
  try {
    var d = document.documentElement;
    var t = localStorage.getItem('syndic_alpha_theme');
    if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
      d.classList.add('dark');
    }
    var p = JSON.parse(localStorage.getItem('syndic_alpha_prefs') || '{}');
    var ok = {
      navTone: ['default', 'card', 'forest', 'ink'],
      font: ['hanken', 'inter', 'manrope', 'system'],
      display: ['serif', 'sans'],
      radius: ['sharp', 'default', 'round']
    };
    for (var k in ok) if (ok[k].indexOf(p[k]) > -1) d.dataset[k] = p[k];
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-nav-tone="forest" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
