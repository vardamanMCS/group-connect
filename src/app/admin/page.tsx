import Link from 'next/link';
import {
  Users,
  Megaphone,
  ShoppingCart,
  Coins,
  Plus,
  ArrowRight,
  Activity,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // --- Stats ---------------------------------------------------------------

  // Active commissioners
  const { count: activeCommissioners } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'commissioner')
    .eq('status', 'active');

  // Active campaigns
  const { count: activeCampaigns } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  // Total orders
  const { count: totalOrdersCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true });

  const { data: orderAmounts } = await supabase
    .from('orders')
    .select('amount')
    .not('status', 'eq', 'cancelled')
    .not('status', 'eq', 'refunded');

  const totalOrdersAmount = (orderAmounts ?? []).reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );

  // Commissions to validate (estimated status)
  const { count: estimatedCommissions } = await supabase
    .from('commissions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'estimated');

  // --- Recent activity from events_log -----------------------------------

  const { data: recentEvents } = await supabase
    .from('events_log')
    .select('*, profiles:commissioner_id ( full_name )')
    .order('created_at', { ascending: false })
    .limit(10);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">
          Vue d&apos;ensemble de l&apos;activite Group Connect
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats cards                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active commissioners */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#1B4965]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {activeCommissioners ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Commissionnaires actifs
          </p>
        </div>

        {/* Active campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {activeCampaigns ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Campagnes en cours</p>
        </div>

        {/* Total orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-[#2D6A4F]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalOrdersCount ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Commandes totales ({formatCurrency(totalOrdersAmount)})
          </p>
        </div>

        {/* Commissions to validate */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {estimatedCommissions ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Commissions a valider
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Quick actions                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1B4965] text-white text-sm font-medium rounded-lg hover:bg-[#153a52] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Creer une campagne
        </Link>
        <Link
          href="/admin/commissioners"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Users className="w-4 h-4" />
          Gerer les commissionnaires
        </Link>
        <Link
          href="/admin/commissions"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Coins className="w-4 h-4" />
          Valider les commissions
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Recent activity                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Activite recente
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {(recentEvents ?? []).length > 0 ? (
            (recentEvents ?? []).map((event) => {
              const commissionerName =
                (event.profiles as { full_name: string | null } | null)
                  ?.full_name ?? 'Inconnu';

              return (
                <div
                  key={event.id}
                  className="px-5 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{commissionerName}</span>
                      {' - '}
                      <span className="text-gray-600">{event.event_type}</span>
                    </p>
                    {event.metadata && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {typeof event.metadata === 'object'
                          ? JSON.stringify(event.metadata)
                          : String(event.metadata)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatDate(event.created_at)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Aucune activite recente
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
