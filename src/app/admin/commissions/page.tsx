import Link from 'next/link';
import { Coins, CheckCircle } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Commission, Profile, Campaign } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommissionWithRelations extends Commission {
  profiles: Pick<Profile, 'full_name'> | null;
  campaigns: Pick<Campaign, 'name'> | null;
  orders: { amount: number } | null;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusLabels: Record<Commission['status'], string> = {
  estimated: 'Estimee',
  validated: 'Validee',
  paid: 'Versee',
};

const statusColors: Record<Commission['status'], string> = {
  estimated: 'bg-amber-100 text-amber-700',
  validated: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminCommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const filterStatus = params.status ?? 'all';

  // --- Fetch commissions with relations ------------------------------------

  let query = supabase
    .from('commissions')
    .select(
      '*, profiles:commissioner_id ( full_name ), campaigns:campaign_id ( name ), orders:order_id ( amount )',
    )
    .order('created_at', { ascending: false });

  if (filterStatus !== 'all') {
    query = query.eq('status', filterStatus);
  }

  const { data: commissions } = await query;
  const commissionList = (commissions ?? []) as CommissionWithRelations[];

  // --- Summary stats -------------------------------------------------------

  const totalEstimated = commissionList
    .filter((c) => c.status === 'estimated')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalValidated = commissionList
    .filter((c) => c.status === 'validated')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaid = commissionList
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalAll = commissionList.reduce((sum, c) => sum + c.amount, 0);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const filterOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'estimated', label: 'Estimees' },
    { value: 'validated', label: 'Validees' },
    { value: 'paid', label: 'Versees' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
          <p className="text-gray-500 text-sm mt-1">
            Suivi et validation des commissions
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2D6A4F] text-white text-sm font-medium rounded-lg hover:bg-[#245a42] transition-colors disabled:opacity-50 cursor-not-allowed"
          disabled
          title="Fonctionnalite a venir"
        >
          <CheckCircle className="w-4 h-4" />
          Valider les commissions selectionnees
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(totalAll)}
          </p>
          <p className="text-xs text-gray-400">
            {commissionList.length} commission
            {commissionList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <p className="text-xs text-amber-600 mb-1">Estimees</p>
          <p className="text-lg font-bold text-amber-700">
            {formatCurrency(totalEstimated)}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <p className="text-xs text-blue-600 mb-1">Validees</p>
          <p className="text-lg font-bold text-blue-700">
            {formatCurrency(totalValidated)}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <p className="text-xs text-green-600 mb-1">Versees</p>
          <p className="text-lg font-bold text-green-700">
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            href={
              opt.value === 'all'
                ? '/admin/commissions'
                : `/admin/commissions?status=${opt.value}`
            }
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === opt.value
                ? 'bg-[#1B4965] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Commissions table */}
      {commissionList.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Commissionnaire
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">
                    Campagne
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Commande
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Taux
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Commission
                  </th>
                  <th className="text-center px-5 py-3 font-medium text-gray-500">
                    Statut
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commissionList.map((commission) => (
                  <tr
                    key={commission.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {commission.profiles?.full_name ?? 'Inconnu'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {commission.campaigns?.name ?? '-'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {commission.orders
                        ? formatCurrency(commission.orders.amount)
                        : '-'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {(commission.rate * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(commission.amount)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[commission.status]}`}
                      >
                        {statusLabels[commission.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-400 whitespace-nowrap">
                      {formatDate(commission.estimated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {commissionList.map((commission) => (
              <div key={commission.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm">
                    {commission.profiles?.full_name ?? 'Inconnu'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[commission.status]}`}
                  >
                    {statusLabels[commission.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {commission.campaigns?.name ?? '-'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Commande :{' '}
                    {commission.orders
                      ? formatCurrency(commission.orders.amount)
                      : '-'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(commission.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Taux : {(commission.rate * 100).toFixed(1)}%</span>
                  <span>{formatDate(commission.estimated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Coins className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune commission trouvee</p>
        </div>
      )}
    </div>
  );
}
