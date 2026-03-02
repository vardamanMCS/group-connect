import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type {
  Campaign,
  Offer,
  CommissionerCampaign,
  ContactGroup,
} from '@/types/database';
import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import CommissionGauge from '@/components/commission-gauge';
import {
  ArrowLeft,
  Wine,
  Package,
  Users,
  MessageSquare,
  ShoppingCart,
  Euro,
  ChevronRight,
  Bell,
  Store,
  Plus,
  Send,
} from 'lucide-react';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getCampaignStatusBadge(status: Campaign['status']): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'draft':
      return 'brouillon';
    case 'closed':
      return 'terminee';
    case 'archived':
      return 'terminee';
    default:
      return status;
  }
}

function formatEuros(amount: number): string {
  return (
    amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' \u20ac'
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch campaign with all related data
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      offers (*),
      commissioner_campaigns (
        id,
        commissioner_id,
        status,
        personal_shop_url
      ),
      contact_groups (
        *,
        group_members (
          id,
          status,
          contacts (id, full_name)
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !campaign) {
    notFound();
  }

  // Cast with proper types
  const offer = campaign.offers as Offer;
  const commissionerCampaign = (
    campaign.commissioner_campaigns as CommissionerCampaign[]
  ).find((cc) => cc.commissioner_id === user.id);
  const groups = campaign.contact_groups as (ContactGroup & {
    group_members: {
      id: string;
      status: string;
      contacts: { id: string; full_name: string };
    }[];
  })[];

  // Fetch messages count
  const { count: messagesCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', id)
    .eq('commissioner_id', user.id)
    .eq('status', 'sent');

  // Fetch prepared messages count
  const { count: preparedMessagesCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', id)
    .eq('commissioner_id', user.id)
    .eq('status', 'prepared');

  // Fetch orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, amount, status')
    .eq('campaign_id', id)
    .eq('commissioner_id', user.id);

  // Fetch commissions
  const { data: commissions } = await supabase
    .from('commissions')
    .select('id, amount, status')
    .eq('campaign_id', id)
    .eq('commissioner_id', user.id);

  // Fetch commission tiers for the gauge
  const { data: tiers } = await supabase
    .from('commission_tiers')
    .select('*')
    .or(`campaign_id.eq.${id},campaign_id.is.null`)
    .order('amount_threshold', { ascending: true });

  // Compute stats
  const totalContacts = groups.reduce(
    (sum, g) => sum + g.group_members.length,
    0
  );
  const ordersCount = orders?.length ?? 0;
  const totalCommissions =
    commissions?.reduce((sum, c) => sum + c.amount, 0) ?? 0;

  // Count contacts to remind
  const contactsToRemind = groups.reduce(
    (sum, g) =>
      sum + g.group_members.filter((m) => m.status === 'to_remind').length,
    0
  );

  // Commission gauge values
  const nextTier = tiers?.find((t) => t.amount_threshold > totalCommissions);
  const nextTierAmount = nextTier?.amount_threshold ?? 500;
  const nextTierLabel = nextTier?.label;

  const accentColor =
    offer.offer_type === 'domaines_villages' ? '#722F37' : '#2D6A4F';
  const OfferIcon =
    offer.offer_type === 'domaines_villages' ? Wine : Package;
  const personalShopUrl = commissionerCampaign?.personal_shop_url;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux campagnes
      </Link>

      {/* Campaign info header */}
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <OfferIcon className="w-6 h-6" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {campaign.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge status={getCampaignStatusBadge(campaign.status)} />
            <span
              className="text-sm font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${accentColor}15`,
                color: accentColor,
              }}
            >
              {offer.name}
            </span>
          </div>
          {(campaign.start_date || campaign.end_date) && (
            <p className="text-sm text-gray-500 mt-2">
              {formatDate(campaign.start_date)}
              {campaign.end_date && ` - ${formatDate(campaign.end_date)}`}
            </p>
          )}
        </div>
      </div>

      {/* Commission Gauge */}
      <CommissionGauge
        currentAmount={totalCommissions}
        nextTierAmount={nextTierAmount}
        nextTierLabel={nextTierLabel ?? undefined}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label="Contacts"
          value={totalContacts}
          color={accentColor}
        />
        <StatCard
          icon={MessageSquare}
          label="Messages envoy\u00e9s"
          value={messagesCount ?? 0}
          color="#1B4965"
        />
        <StatCard
          icon={ShoppingCart}
          label="Commandes"
          value={ordersCount}
          color="#2D6A4F"
        />
        <StatCard
          icon={Euro}
          label="Commissions"
          value={formatEuros(totalCommissions)}
          color="#2D6A4F"
        />
      </div>

      {/* Vos groupes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Vos groupes</h2>
          <Link
            href={`/groups/new?campaign=${id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#1B4965] min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Nouveau groupe
          </Link>
        </div>

        {groups.length === 0 ? (
          <Card>
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">
                Aucun groupe pour cette campagne
              </p>
              <Link
                href={`/groups/new?campaign=${id}`}
                className="inline-flex items-center gap-2 bg-[#1B4965] text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#153a52] active:bg-[#0f2d40] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Cr&eacute;er un nouveau groupe
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => {
              const memberCount = group.group_members.length;
              const invited = group.group_members.filter(
                (m) => m.status === 'invited'
              ).length;
              const ordered = group.group_members.filter(
                (m) => m.status === 'ordered'
              ).length;
              const toRemind = group.group_members.filter(
                (m) => m.status === 'to_remind'
              ).length;

              return (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="hover:shadow-md active:scale-[0.99] transition-all duration-150">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {memberCount} contact{memberCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {invited > 0 && (
                          <span className="text-xs bg-blue-50 text-[#1B4965] px-2 py-1 rounded-full">
                            {invited} invit&eacute;{invited > 1 ? 's' : ''}
                          </span>
                        )}
                        {ordered > 0 && (
                          <span className="text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-1 rounded-full">
                            {ordered} cmd
                          </span>
                        )}
                        {toRemind > 0 && (
                          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                            {toRemind} relance{toRemind > 1 ? 's' : ''}
                          </span>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}

            <Link
              href={`/groups/new?campaign=${id}`}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-[#1B4965] hover:text-[#1B4965] transition-colors min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              Cr&eacute;er un nouveau groupe
            </Link>
          </div>
        )}
      </section>

      {/* Messages a envoyer */}
      <section>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1B4965]/10 rounded-full flex items-center justify-center">
                <Send className="w-5 h-5 text-[#1B4965]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Messages &agrave; envoyer
                </h3>
                <p className="text-sm text-gray-500">
                  {preparedMessagesCount ?? 0} message
                  {(preparedMessagesCount ?? 0) > 1 ? 's' : ''}{' '}
                  pr&eacute;par&eacute;
                  {(preparedMessagesCount ?? 0) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Link
              href={`/messages?campaign=${id}`}
              className="inline-flex items-center gap-1 bg-[#1B4965] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#153a52] active:bg-[#0f2d40] transition-colors min-h-[44px]"
            >
              Envoyer
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </section>

      {/* Relances */}
      <section>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Relances</h3>
                <p className="text-sm text-gray-500">
                  {contactsToRemind} contact
                  {contactsToRemind > 1 ? 's' : ''} &agrave; relancer
                </p>
              </div>
            </div>
            <Link
              href={`/reminders?campaign=${id}`}
              className="inline-flex items-center gap-1 border-2 border-orange-200 text-orange-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-50 active:bg-orange-100 transition-colors min-h-[44px]"
            >
              Voir
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </section>

      {/* Boutique */}
      {personalShopUrl && (
        <section>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <Store
                    className="w-5 h-5"
                    style={{ color: accentColor }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Votre boutique
                  </h3>
                  <p className="text-sm text-gray-500">
                    Lien personnalis&eacute;
                  </p>
                </div>
              </div>
              <a
                href={personalShopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold min-h-[44px] px-4 py-2.5 rounded-xl border-2 transition-colors"
                style={{
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                }}
              >
                Ouvrir
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
