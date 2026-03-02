import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Megaphone,
  Bell,
  ClipboardList,
  ArrowRight,
  Users,
  Send,
  ShoppingCart,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import type { Profile, Campaign, Offer, CommissionTier } from '@/types/database';
import CommissionGauge from '@/components/commission-gauge';
import { formatCurrency, formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types for the joined queries
// ---------------------------------------------------------------------------

interface CampaignWithOffer extends Campaign {
  offers: Pick<Offer, 'name' | 'color'> | null;
}

interface CampaignStats {
  contactCount: number;
  messagesSent: number;
  ordersCount: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createClient();

  // --- Auth -----------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // --- Fetch profile --------------------------------------------------------
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Commissionnaire';

  // --- Active campaigns with joined offer -----------------------------------
  // First get the commissioner's active campaign links
  const { data: commissionerCampaigns } = await supabase
    .from('commissioner_campaigns')
    .select('campaign_id')
    .eq('commissioner_id', user.id)
    .eq('status', 'active');

  const activeCampaignIds = (commissionerCampaigns ?? []).map(
    (cc) => cc.campaign_id,
  );

  let activeCampaigns: CampaignWithOffer[] = [];

  if (activeCampaignIds.length > 0) {
    const { data } = await supabase
      .from('campaigns')
      .select('*, offers ( name, color )')
      .in('id', activeCampaignIds)
      .eq('status', 'active');

    activeCampaigns = (data ?? []) as CampaignWithOffer[];
  }

  // --- Stats per campaign ---------------------------------------------------
  const campaignStatsMap: Record<string, CampaignStats> = {};

  for (const campaign of activeCampaigns) {
    // Contacts in groups for this campaign
    const { count: contactCount } = await supabase
      .from('contact_groups')
      .select('id', { count: 'exact', head: true })
      .eq('commissioner_id', user.id)
      .eq('campaign_id', campaign.id);

    // Messages sent for this campaign
    const { count: messagesSent } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('commissioner_id', user.id)
      .eq('campaign_id', campaign.id)
      .eq('status', 'sent');

    // Orders for this campaign
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('commissioner_id', user.id)
      .eq('campaign_id', campaign.id);

    campaignStatsMap[campaign.id] = {
      contactCount: contactCount ?? 0,
      messagesSent: messagesSent ?? 0,
      ordersCount: ordersCount ?? 0,
    };
  }

  // --- Commission totals ----------------------------------------------------
  const { data: commissionRows } = await supabase
    .from('commissions')
    .select('amount')
    .eq('commissioner_id', user.id);

  const totalCommission = (commissionRows ?? []).reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );

  // Next commission tier
  const { data: nextTier } = await supabase
    .from('commission_tiers')
    .select('amount_threshold, label')
    .gt('amount_threshold', totalCommission)
    .order('amount_threshold', { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextTierAmount = nextTier?.amount_threshold ?? totalCommission;
  const nextTierLabel = nextTier?.label ?? undefined;

  // --- Quick action stats ---------------------------------------------------
  // Contacts to remind (status = to_remind)
  const { count: remindersCount } = await supabase
    .from('group_members')
    .select('id, contact_groups!inner(commissioner_id)', {
      count: 'exact',
      head: true,
    })
    .eq('status', 'to_remind')
    .eq('contact_groups.commissioner_id', user.id);

  // Pending orders
  const { count: pendingOrdersCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('commissioner_id', user.id)
    .eq('status', 'pending');

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Welcome                                                            */}
      {/* ------------------------------------------------------------------ */}
      <h1 className="text-2xl font-bold text-gray-900">
        Bonjour, {firstName} !
      </h1>

      {/* ------------------------------------------------------------------ */}
      {/* Commission gauge (full version)                                    */}
      {/* ------------------------------------------------------------------ */}
      <CommissionGauge
        currentAmount={totalCommission}
        nextTierAmount={nextTierAmount}
        nextTierLabel={nextTierLabel}
        variant="full"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Active campaigns                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Vos campagnes actives
        </h2>

        {activeCampaigns.length > 0 ? (
          <div className="space-y-3">
            {activeCampaigns.map((campaign) => {
              const stats = campaignStatsMap[campaign.id];
              const offerColor = campaign.offers?.color ?? '#1B4965';
              const offerName = campaign.offers?.name ?? '';

              return (
                <div
                  key={campaign.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                >
                  {/* Campaign header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: offerColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {campaign.name}
                      </h3>
                      {offerName && (
                        <p className="text-sm text-gray-500 truncate">
                          {offerName}
                        </p>
                      )}
                      {(campaign.start_date || campaign.end_date) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {campaign.start_date && formatDate(campaign.start_date)}
                          {campaign.start_date && campaign.end_date && ' - '}
                          {campaign.end_date && formatDate(campaign.end_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {stats.contactCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Send className="w-4 h-4" />
                      {stats.messagesSent}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      {stats.ordersCount}
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="
                      flex items-center justify-center gap-2
                      w-full h-10 rounded-xl
                      bg-[#1B4965] text-white text-sm font-semibold
                      hover:bg-[#153a52] active:bg-[#0f2d40]
                      transition-colors duration-150
                    "
                  >
                    Continuer
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-12 h-12 bg-[#1B4965]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6 text-[#1B4965]" />
            </div>
            <p className="text-gray-600 mb-4">
              Vous n&apos;avez pas encore de campagne active.
            </p>
            <Link
              href="/campaigns"
              className="
                inline-flex items-center justify-center gap-2
                h-10 px-5 rounded-xl
                bg-[#1B4965] text-white text-sm font-semibold
                hover:bg-[#153a52] active:bg-[#0f2d40]
                transition-colors duration-150
              "
            >
              D&eacute;couvrir les campagnes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Quick actions                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Actions rapides
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Reminders */}
          <Link
            href="/reminders"
            className="
              bg-white rounded-2xl shadow-sm border border-gray-100
              p-4 flex flex-col items-start
              hover:shadow-md active:scale-[0.98]
              transition-all duration-150
            "
          >
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {remindersCount ?? 0}
            </span>
            <span className="text-sm text-gray-500 mt-0.5">
              {(remindersCount ?? 0) <= 1
                ? 'rappel \u00e0 envoyer'
                : 'rappels \u00e0 envoyer'}
            </span>
          </Link>

          {/* Pending orders */}
          <Link
            href="/results"
            className="
              bg-white rounded-2xl shadow-sm border border-gray-100
              p-4 flex flex-col items-start
              hover:shadow-md active:scale-[0.98]
              transition-all duration-150
            "
          >
            <div className="w-10 h-10 bg-[#1B4965]/10 rounded-full flex items-center justify-center mb-3">
              <ClipboardList className="w-5 h-5 text-[#1B4965]" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {pendingOrdersCount ?? 0}
            </span>
            <span className="text-sm text-gray-500 mt-0.5">
              {(pendingOrdersCount ?? 0) <= 1
                ? 'participation en attente'
                : 'participations en attente'}
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
