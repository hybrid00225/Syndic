import {
  AlertTriangle,
  Building,
  Building2,
  Home,
  LayoutDashboard,
  ReceiptText,
  Users,
  type LucideIcon,
} from 'lucide-react';

// Structure unique de la navigation : menu latéral, barre horizontale et tiroir mobile.
type NavItem = { href: string; label: string; icon: LucideIcon; soon?: boolean };
type NavSection = { title: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Vue d'ensemble",
    items: [{ href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard }],
  },
  {
    title: 'Patrimoine',
    items: [
      { href: '/coproprietes', label: 'Copropriétés', icon: Building },
      { href: '/batiments', label: 'Bâtiments', icon: Building2 },
      { href: '/lots', label: 'Lots', icon: Home },
      { href: '/coproprietaires', label: 'Copropriétaires', icon: Users },
    ],
  },
  {
    title: 'Finances',
    items: [
      { href: '/appels', label: 'Appels de fonds', icon: ReceiptText, soon: true },
      { href: '/impayes', label: 'Impayés', icon: AlertTriangle, soon: true },
    ],
  },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}
