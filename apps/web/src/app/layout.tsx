import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/query';

export const metadata: Metadata = {
  title: { default: 'Syndic Alpha', template: '%s · Syndic Alpha' },
  description: 'Gestion de syndic de copropriété',
};

// Applique le thème enregistré avant le rendu (évite le flash).
const themeScript = `
  try {
    var t = localStorage.getItem('syndic_alpha_theme');
    if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
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
