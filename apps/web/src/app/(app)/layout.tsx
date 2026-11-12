'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { usePreferences } from '@/lib/preferences';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { TopNav } from '@/components/top-nav';
import { Topbar } from '@/components/topbar';
import { BootLoader } from '@/components/ui/spinner';
import { ConfirmProvider } from '@/components/ui/confirm';
import { DocumentPreviewProvider } from '@/components/ui/document-preview';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { prefs } = usePreferences();
  const [navOpen, setNavOpen] = useState(false);
  const topnav = prefs.layout === 'topnav';

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return <BootLoader />;

  return (
    <ConfirmProvider>
      <DocumentPreviewProvider>
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow-lift">Aller au contenu</a>
        <div className="flex min-h-screen">
          {/* Grand écran : menu latéral (sauf disposition « barre ») ; petit écran : tiroir. */}
          {!topnav && <Sidebar className="hidden lg:flex" />}
          <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onOpenNav={() => setNavOpen(true)} showBrand={topnav} />
            {topnav && <TopNav />}
            <main id="contenu" className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
              {children}
            </main>
          </div>
        </div>
      </DocumentPreviewProvider>
    </ConfirmProvider>
  );
}
