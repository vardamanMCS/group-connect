import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ContactGroup, Campaign, Offer } from '@/types/database';
import Card from '@/components/ui/card';
import {
  Users,
  Plus,
  ChevronRight,
  Wine,
  Package,
  FolderOpen,
} from 'lucide-react';

type GroupWithDetails = ContactGroup & {
  campaigns: Campaign & {
    offers: Offer;
  };
  group_members: {
    id: string;
    status: string;
  }[];
};

type GroupedByCampaign = {
  campaign: Campaign & { offers: Offer };
  groups: GroupWithDetails[];
};

function getStatusSummary(members: { status: string }[]) {
  const counts: Record<string, number> = {};
  for (const m of members) {
    counts[m.status] = (counts[m.status] || 0) + 1;
  }
  return counts;
}

export default async function GroupsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all groups for the user with campaign and offer info
  const { data: groups, error } = await supabase
    .from('contact_groups')
    .select(`
      *,
      campaigns (
        *,
        offers (*)
      ),
      group_members (
        id,
        status
      )
    `)
    .eq('commissioner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching groups:', error);
  }

  const allGroups = (groups as GroupWithDetails[] | null) ?? [];

  // Group by campaign
  const campaignMap = new Map<string, GroupedByCampaign>();
  for (const group of allGroups) {
    const campaignId = group.campaign_id;
    if (!campaignMap.has(campaignId)) {
      campaignMap.set(campaignId, {
        campaign: group.campaigns,
        groups: [],
      });
    }
    campaignMap.get(campaignId)!.groups.push(group);
  }
  const groupedByCampaign = Array.from(campaignMap.values());

  const isEmpty = allGroups.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1B4965]/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-[#1B4965]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mes groupes</h1>
            <p className="text-sm text-gray-500">
              {isEmpty
                ? 'Organisez vos contacts'
                : `${allGroups.length} groupe${allGroups.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <Link
          href="/groups/new"
          className="inline-flex items-center gap-1.5 bg-[#1B4965] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#153a52] active:bg-[#0f2d40] transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Cr&eacute;er
        </Link>
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Aucun groupe
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            Cr&eacute;ez votre premier groupe de contacts pour commencer
            &agrave; envoyer des messages.
          </p>
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-2 bg-[#1B4965] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#153a52] active:bg-[#0f2d40] transition-colors min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            Cr&eacute;er un groupe
          </Link>
        </div>
      ) : (
        groupedByCampaign.map(({ campaign, groups: campaignGroups }) => {
          const offer = campaign.offers;
          const accentColor =
            offer.offer_type === 'domaines_villages' ? '#722F37' : '#2D6A4F';
          const OfferIcon =
            offer.offer_type === 'domaines_villages' ? Wine : Package;

          return (
            <section key={campaign.id}>
              {/* Campaign header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <OfferIcon
                  className="w-4 h-4"
                  style={{ color: accentColor }}
                />
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {campaign.name}
                </h2>
              </div>

              <div className="space-y-2">
                {campaignGroups.map((group) => {
                  const memberCount = group.group_members.length;
                  const statusSummary = getStatusSummary(group.group_members);

                  return (
                    <Link key={group.id} href={`/groups/${group.id}`}>
                      <Card className="hover:shadow-md active:scale-[0.99] transition-all duration-150">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {group.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {memberCount} contact
                                {memberCount > 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* Status pills */}
                            {memberCount > 0 && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {statusSummary.pending && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    {statusSummary.pending} &agrave; contacter
                                  </span>
                                )}
                                {statusSummary.invited && (
                                  <span className="text-xs bg-blue-50 text-[#1B4965] px-2 py-0.5 rounded-full">
                                    {statusSummary.invited} invit&eacute;
                                    {statusSummary.invited > 1 ? 's' : ''}
                                  </span>
                                )}
                                {statusSummary.ordered && (
                                  <span className="text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 rounded-full">
                                    {statusSummary.ordered} command&eacute;
                                  </span>
                                )}
                                {statusSummary.to_remind && (
                                  <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                                    {statusSummary.to_remind} relance
                                    {statusSummary.to_remind > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
