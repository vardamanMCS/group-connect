import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Coins,
  Settings,
  Wine,
  ArrowLeft,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

interface AdminNavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const adminNavItems: AdminNavItem[] = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Campagnes', href: '/admin/campaigns', icon: Megaphone },
  { label: 'Commissionnaires', href: '/admin/commissioners', icon: Users },
  { label: 'Commissions', href: '/admin/commissions', icon: Coins },
  { label: 'Parametres', href: '/admin/settings', icon: Settings },
];

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // --- Auth & role check ---------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar (desktop)                                                  */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-[#1B4965] text-white">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <Wine className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Back-office MCS</p>
            <p className="text-xs text-white/60">Maison Colin-Seguin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to app */}
        <div className="px-3 pb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour a l&apos;app
          </Link>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-sm font-medium truncate">
            {profile.full_name ?? 'Admin'}
          </p>
          <p className="text-xs text-white/50">Administrateur</p>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile top nav                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden bg-[#1B4965] text-white px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Wine className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">Back-office MCS</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
