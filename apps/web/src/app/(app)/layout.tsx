'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { PageLoader } from '@/components/ui/spinner';
import { ConfirmProvider } from '@/components/ui/confirm';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return <PageLoader />;

  return (
    <ConfirmProvider>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow-lift">Aller au contenu</a>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="contenu" className="flex-1 overflow-x-hidden px-6 py-8 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
