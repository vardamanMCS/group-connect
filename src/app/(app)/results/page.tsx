import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Badge from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart3,
  ShoppingCart,
  Euro,
  Users,
  TrendingUp,
  ChevronRight,
  Package,
  Megaphone,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helper: order status -> badge status mapping
// ---------------------------------------------------------------------------

function getOrderStatusBadge(status: string): { badgeStatus: string; label: string } {
  switch (status) {
    case 'pending':
      return { badgeStatus: 'en-attente', label: 'En attente' };
    case 'paid':
      return { badgeStatus: 'envoye', label: 'Payee' };
    case 'shipped':
      return { badgeStatus: 'en-cours', label: 'Expediee' };
    case 'delivered':
      return { badgeStatus: 'livre', label: 'Livree' };
    case 'cancelled':
      return { badgeStatus: 'annule', label: 'Annulee' };
    case 'refunded':
      return { badgeStatus: 'annule', label: 'Remboursee' };
    default:
      return { badgeStatus: 'a-faire', label: status };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ResultsPage() {
  const supabase = await createClient();

  // --- Auth -----------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // --- Fetch all orders for this commissioner --------------------------------
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      campaigns (
        id,
        name,
        offers (
          name,
          color,
          default_commission_rate
        )
      )
    `)
    .eq('commissioner_id', user.id)
    .order('order_date', { ascending: false });

  const allOrders = orders ?? [];

  // --- Fetch commissions for this commissioner --------------------------------
  const { data: commissions } = await supabase
    .from('commissions')
    .select('id, amount, campaign_id, status')
    .eq('commissioner_id', user.id);

  const allCommissions = commissions ?? [];

  // --- Fetch group members for conversion rate --------------------------------
  // Count total invited contacts (invited, clicked, ordered, to_remind)
  const { count: totalInvitedCount } = await supabase
    .from('group_members')
    .select('id, contact_groups!inner(commissioner_id)', {
      count: 'exact',
      head: true,
    })
    .eq('contact_groups.commissioner_id', user.id)
    .in('status', ['invited', 'clicked', 'ordered', 'to_remind']);

  // Count contacts who ordered
  const { count: totalOrderedCount } = await supabase
    .from('group_members')
    .select('id, contact_groups!inner(commissioner_id)', {
      count: 'exact',
      head: true,
    })
    .eq('contact_groups.commissioner_id', user.id)
    .eq('status', 'ordered');

  // Count contacts who clicked or ordered (active contacts)
  const { count: activeContactsCount } = await supabase
    .from('group_members')
    .select('id, contact_groups!inner(commissioner_id)', {
      count: 'exact',
      head: true,
    })
    .eq('contact_groups.commissioner_id', user.id)
    .in('status', ['clicked', 'ordered']);

  // --- Compute stats --------------------------------------------------------
  const totalOrders = allOrders.length;
  const totalAmount = allOrders.reduce((sum, o) => sum + (o.amount ?? 0), 0);
  const activeContacts = activeContactsCount ?? 0;
  const totalInvited = totalInvitedCount ?? 0;
  const totalOrdered = totalOrderedCount ?? 0;
  const conversionRate =
    totalInvited > 0
      ? Math.round((totalOrdered / totalInvited) * 100)
      : 0;

  // --- Campaign performance --------------------------------------------------
  // Get active campaigns for this commissioner
  const { data: commissionerCampaigns } = await supabase
    .from('commissioner_campaigns')
    .select(`
      campaign_id,
      status,
      campaigns (
        id,
        name,
        status,
        offers (
          name,
          color
        )
      )
    `)
    .eq('commissioner_id', user.id)
    .eq('status', 'active');

  interface CampaignPerformance {
    campaignId: string;
    campaignName: string;
    offerName: string | null;
    offerColor: string | null;
    ordersCount: number;
    ordersAmount: number;
    commissionEarned: number;
  }

  const campaignPerformances: CampaignPerformance[] = [];

  for (const cc of commissionerCampaigns ?? []) {
    const campaign = cc.campaigns as unknown as {
      id: string;
      name: string;
      status: string;
      offers: { name: string; color: string | null } | null;
    };

    const campaignOrders = allOrders.filter(
      (o) => o.campaign_id === campaign.id,
    );
    const campaignCommissions = allCommissions.filter(
      (c) => c.campaign_id === campaign.id,
    );

    campaignPerformances.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      offerName: campaign.offers?.name ?? null,
      offerColor: campaign.offers?.color ?? null,
      ordersCount: campaignOrders.length,
      ordersAmount: campaignOrders.reduce(
        (sum, o) => sum + (o.amount ?? 0),
        0,
      ),
      commissionEarned: campaignCommissions.reduce(
        (sum, c) => sum + (c.amount ?? 0),
        0,
      ),
    });
  }

  // --- Recent orders (last 10) -----------------------------------------------
  const recentOrders = allOrders.slice(0, 10);

  const isEmpty = totalOrders === 0;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1B4965]/10 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#1B4965]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Resultats</h1>
          <p className="text-sm text-gray-500">
            {isEmpty
              ? 'Vos resultats apparaitront ici'
              : 'Vue globale de vos performances'}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Empty state                                                        */}
      {/* ------------------------------------------------------------------ */}
      {isEmpty && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Pas encore de resultats
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            Vos resultats apparaitront ici des que vos contacts passeront commande.
          </p>
          <Link
            href="/campaigns"
            className="
              inline-flex items-center justify-center gap-2
              h-12 px-6 rounded-xl
              bg-[#1B4965] text-white font-semibold
              hover:bg-[#153a52] active:bg-[#0f2d40]
              transition-colors duration-150
            "
          >
            <Megaphone className="w-5 h-5" />
            Voir mes campagnes
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Stats cards                                                        */}
      {/* ------------------------------------------------------------------ */}
      {!isEmpty && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Total commandes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#1B4965]/10">
                <ShoppingCart className="w-5 h-5 text-[#1B4965]" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {totalOrders}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                Commande{totalOrders > 1 ? 's' : ''}
              </span>
            </div>

            {/* Montant total */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#2D6A4F]/10">
                <Euro className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                Montant total
              </span>
            </div>

            {/* Contacts actifs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#1B4965]/10">
                <Users className="w-5 h-5 text-[#1B4965]" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {activeContacts}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                Contact{activeContacts > 1 ? 's' : ''} actif{activeContacts > 1 ? 's' : ''}
              </span>
            </div>

            {/* Taux de conversion */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#2D6A4F]/10">
                <TrendingUp className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {conversionRate} %
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                Taux de conversion
              </span>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Campaign performance                                             */}
          {/* ---------------------------------------------------------------- */}
          {campaignPerformances.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Performance par campagne
              </h2>
              <div className="space-y-3">
                {campaignPerformances.map((cp) => {
                  const color = cp.offerColor ?? '#1B4965';
                  // Progress indicator: orders relative to a reasonable target
                  const progressTarget = Math.max(cp.ordersCount, 10);
                  const progressPercent = Math.min(
                    (cp.ordersCount / progressTarget) * 100,
                    100,
                  );

                  return (
                    <Link
                      key={cp.campaignId}
                      href={`/campaigns/${cp.campaignId}`}
                      className="block"
                    >
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md active:scale-[0.99] transition-all duration-150">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {cp.campaignName}
                            </h3>
                            {cp.offerName && (
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1"
                                style={{
                                  backgroundColor: `${color}15`,
                                  color: color,
                                }}
                              >
                                {cp.offerName}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <span className="flex items-center gap-1 text-gray-600">
                            <ShoppingCart className="w-4 h-4" />
                            {cp.ordersCount} cmd
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Euro className="w-4 h-4" />
                            {formatCurrency(cp.ordersAmount)}
                          </span>
                        </div>

                        {/* Commission earned */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#2D6A4F]">
                            Commission : {formatCurrency(cp.commissionEarned)}
                          </span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${progressPercent}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Recent orders                                                     */}
          {/* ---------------------------------------------------------------- */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Commandes recentes
            </h2>

            {recentOrders.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const { badgeStatus, label } = getOrderStatusBadge(
                    order.status,
                  );
                  const campaign = order.campaigns as unknown as {
                    id: string;
                    name: string;
                    offers: {
                      name: string;
                      color: string | null;
                      default_commission_rate: number;
                    } | null;
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {order.customer_name || 'Client anonyme'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {campaign?.name ?? 'Campagne'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(order.order_date)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.amount)}
                          </span>
                          <Badge status={badgeStatus}>{label}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Aucune commande pour le moment
                </p>
              </div>
            )}
          </section>

          {/* Commission CTA */}
          <Link
            href="/commissions"
            className="
              flex items-center justify-between
              bg-[#2D6A4F] text-white
              rounded-2xl p-5
              hover:bg-[#245740] active:bg-[#1b4432]
              transition-colors duration-150
            "
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Voir mes commissions</p>
                <p className="text-sm text-white/80">
                  Detail et historique
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </>
      )}
    </div>
  );
}
