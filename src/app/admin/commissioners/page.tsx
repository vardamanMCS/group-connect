import Link from 'next/link';
import { Users, Search, Phone, MapPin, Megaphone } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatPhone } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import type { Profile } from '@/types/database';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusLabels: Record<Profile['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente',
};

const statusColors: Record<Profile['status'], string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-100 text-amber-700',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminCommissionersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const filterStatus = params.status ?? 'all';
  const searchQuery = params.q ?? '';

  // --- Fetch commissioners ---------------------------------------------------

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'commissioner')
    .order('full_name', { ascending: true });

  if (filterStatus !== 'all') {
    query = query.eq('status', filterStatus);
  }

  if (searchQuery) {
    query = query.ilike('full_name', `%${searchQuery}%`);
  }

  const { data: commissioners } = await query;
  const commissionerList = (commissioners ?? []) as Profile[];

  // --- Fetch stats for each commissioner -----------------------------------

  const campaignCounts: Record<string, number> = {};
  const commissionTotals: Record<string, number> = {};

  for (const commissioner of commissionerList) {
    const { count: ccCount } = await supabase
      .from('commissioner_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('commissioner_id', commissioner.id)
      .eq('status', 'active');

    campaignCounts[commissioner.id] = ccCount ?? 0;

    const { data: commissionRows } = await supabase
      .from('commissions')
      .select('amount')
      .eq('commissioner_id', commissioner.id);

    commissionTotals[commissioner.id] = (commissionRows ?? []).reduce(
      (sum, row) => sum + (row.amount ?? 0),
      0,
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const filterOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'pending', label: 'En attente' },
    { value: 'inactive', label: 'Inactifs' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Commissionnaires</h1>
        <p className="text-gray-500 text-sm mt-1">
          {commissionerList.length} commissionnaire
          {commissionerList.length !== 1 ? 's' : ''} trouve
          {commissionerList.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Rechercher par nom..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
            />
          </div>
        </form>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <Link
              key={opt.value}
              href={
                opt.value === 'all'
                  ? `/admin/commissioners${searchQuery ? `?q=${searchQuery}` : ''}`
                  : `/admin/commissioners?status=${opt.value}${searchQuery ? `&q=${searchQuery}` : ''}`
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
      </div>

      {/* Commissioners list */}
      {commissionerList.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {commissionerList.map((commissioner) => {
            const displayName = commissioner.full_name ?? 'Sans nom';
            const initials = commissioner.full_name
              ? getInitials(commissioner.full_name)
              : '?';

            return (
              <div
                key={commissioner.id}
                className="p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-[#1B4965] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {initials}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {displayName}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[commissioner.status]}`}
                      >
                        {statusLabels[commissioner.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-gray-500">
                      {commissioner.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {formatPhone(commissioner.phone)}
                        </span>
                      )}
                      {commissioner.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {commissioner.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-sm flex-shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Megaphone className="w-3.5 h-3.5" />
                        <span className="font-semibold text-gray-900">
                          {campaignCounts[commissioner.id] ?? 0}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">campagnes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-[#2D6A4F]">
                        {formatCurrency(
                          commissionTotals[commissioner.id] ?? 0,
                        )}
                      </p>
                      <p className="text-xs text-gray-400">commissions</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun commissionnaire trouve</p>
        </div>
      )}
    </div>
  );
}
