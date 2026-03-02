import Link from 'next/link';
import { Plus, Megaphone, Calendar, Users, ShoppingCart } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Campaign, Offer } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignWithOffer extends Campaign {
  offers: Pick<Offer, 'name' | 'color' | 'offer_type'> | null;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusLabels: Record<Campaign['status'], string> = {
  draft: 'Brouillon',
  active: 'Active',
  closed: 'Terminee',
  archived: 'Archivee',
};

const statusColors: Record<Campaign['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-100 text-gray-400',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const filterStatus = params.status ?? 'all';

  // --- Fetch campaigns with offer ------------------------------------------

  let query = supabase
    .from('campaigns')
    .select('*, offers ( name, color, offer_type )')
    .order('created_at', { ascending: false });

  if (filterStatus !== 'all') {
    query = query.eq('status', filterStatus);
  }

  const { data: campaigns } = await query;
  const campaignList = (campaigns ?? []) as CampaignWithOffer[];

  // --- Fetch commissioner counts per campaign --------------------------------

  const campaignIds = campaignList.map((c) => c.id);

  const commissionerCounts: Record<string, number> = {};
  const orderCounts: Record<string, number> = {};
  const orderAmounts: Record<string, number> = {};

  for (const id of campaignIds) {
    const { count: ccCount } = await supabase
      .from('commissioner_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id);

    commissionerCounts[id] = ccCount ?? 0;

    const { data: orders } = await supabase
      .from('orders')
      .select('amount')
      .eq('campaign_id', id)
      .not('status', 'eq', 'cancelled')
      .not('status', 'eq', 'refunded');

    orderCounts[id] = (orders ?? []).length;
    orderAmounts[id] = (orders ?? []).reduce(
      (sum, o) => sum + (o.amount ?? 0),
      0,
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const filterOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'active', label: 'Actives' },
    { value: 'closed', label: 'Terminees' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestion des campagnes commerciales
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1B4965] text-white text-sm font-medium rounded-lg hover:bg-[#153a52] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Creer une campagne
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            href={
              opt.value === 'all'
                ? '/admin/campaigns'
                : `/admin/campaigns?status=${opt.value}`
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

      {/* Campaigns list */}
      {campaignList.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {campaignList.map((campaign) => {
            const offerName = campaign.offers?.name ?? 'Offre inconnue';
            const offerColor = campaign.offers?.color ?? '#1B4965';

            return (
              <div
                key={campaign.id}
                className="p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Campaign info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: offerColor }}
                      />
                      <h3 className="font-semibold text-gray-900 truncate">
                        {campaign.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}
                      >
                        {statusLabels[campaign.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{offerName}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {(campaign.start_date || campaign.end_date) && (
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="w-4 h-4" />
                        {campaign.start_date
                          ? formatDate(campaign.start_date)
                          : '...'}
                        {' - '}
                        {campaign.end_date
                          ? formatDate(campaign.end_date)
                          : '...'}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {commissionerCounts[campaign.id] ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      {orderCounts[campaign.id] ?? 0}
                    </span>
                    <span className="font-medium text-gray-700 whitespace-nowrap">
                      {formatCurrency(orderAmounts[campaign.id] ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune campagne trouvee</p>
        </div>
      )}
    </div>
  );
}
