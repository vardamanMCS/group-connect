import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Campaign, Offer, CommissionerCampaign, ContactGroup } from '@/types/database';
import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import { Megaphone, Wine, Package, Users, ChevronRight, CalendarDays } from 'lucide-react';

type CampaignWithDetails = Campaign & {
  offers: Offer;
  commissioner_campaigns: CommissionerCampaign[];
  contact_groups: (ContactGroup & {
    group_members: { id: string }[];
  })[];
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
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

function CampaignCard({
  campaign,
  isActive,
  accentColor,
}: {
  campaign: CampaignWithDetails;
  isActive: boolean;
  accentColor: string;
}) {
  const totalContacts = campaign.contact_groups.reduce(
    (sum, g) => sum + g.group_members.length,
    0
  );
  const groupCount = campaign.contact_groups.length;

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block">
      <Card className="hover:shadow-md active:scale-[0.99] transition-all duration-150">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            {campaign.offers.offer_type === 'domaines_villages' ? (
              <Wine className="w-6 h-6" style={{ color: accentColor }} />
            ) : (
              <Package className="w-6 h-6" style={{ color: accentColor }} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {campaign.name}
              </h3>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            </div>

            {campaign.season && (
              <p className="text-sm text-gray-500 mb-2">{campaign.season}</p>
            )}

            {/* Dates */}
            {(campaign.start_date || campaign.end_date) && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {formatDate(campaign.start_date)}
                  {campaign.end_date && ` - ${formatDate(campaign.end_date)}`}
                </span>
              </div>
            )}

            {/* Status + stats */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge status={getCampaignStatusBadge(campaign.status)} />
              {totalContacts > 0 && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  {totalContacts} contact{totalContacts > 1 ? 's' : ''}
                </span>
              )}
              {groupCount > 0 && (
                <span className="text-sm text-gray-400">
                  {groupCount} groupe{groupCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          {isActive ? (
            <span
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: accentColor }}
            >
              Voir la campagne
              <ChevronRight className="w-4 h-4" />
            </span>
          ) : (
            <span className="text-sm font-semibold text-[#1B4965] flex items-center gap-1">
              Activer cette campagne
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default async function CampaignsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all active/draft campaigns with offers, commissioner status, and groups
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      offers (*),
      commissioner_campaigns!inner (
        id,
        commissioner_id,
        status
      ),
      contact_groups (
        *,
        group_members (id)
      )
    `)
    .eq('commissioner_campaigns.commissioner_id', user.id)
    .in('status', ['active', 'draft'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
  }

  const allCampaigns = (campaigns as CampaignWithDetails[] | null) ?? [];

  // Group by offer type
  const domainesCampaigns = allCampaigns.filter(
    (c) => c.offers.offer_type === 'domaines_villages'
  );
  const colisCampaigns = allCampaigns.filter(
    (c) => c.offers.offer_type === 'colis_coteau'
  );

  const isEmpty = allCampaigns.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1B4965]/10 rounded-xl flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-[#1B4965]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campagnes</h1>
          <p className="text-sm text-gray-500">
            {isEmpty
              ? 'Vos campagnes apparaitront ici'
              : `${allCampaigns.length} campagne${allCampaigns.length > 1 ? 's' : ''} disponible${allCampaigns.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Aucune campagne disponible
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Aucune campagne disponible pour le moment. Revenez bientot !
          </p>
        </div>
      ) : (
        <>
          {/* Domaines & Villages Section */}
          {domainesCampaigns.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[#722F37] rounded-full" />
                <h2 className="text-lg font-bold text-gray-900">
                  Domaines &amp; Villages
                </h2>
                <Wine className="w-5 h-5 text-[#722F37]" />
              </div>
              <div className="space-y-3">
                {domainesCampaigns.map((campaign) => {
                  const isActive = campaign.commissioner_campaigns.some(
                    (cc) => cc.status === 'active'
                  );
                  return (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      isActive={isActive}
                      accentColor="#722F37"
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Les Colis du Coteau Section */}
          {colisCampaigns.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[#2D6A4F] rounded-full" />
                <h2 className="text-lg font-bold text-gray-900">
                  Les Colis du Coteau
                </h2>
                <Package className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <div className="space-y-3">
                {colisCampaigns.map((campaign) => {
                  const isActive = campaign.commissioner_campaigns.some(
                    (cc) => cc.status === 'active'
                  );
                  return (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      isActive={isActive}
                      accentColor="#2D6A4F"
                    />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
