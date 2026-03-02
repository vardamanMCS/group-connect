import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type {
  ContactGroup,
  Campaign,
  Offer,
  Contact,
  GroupMember,
} from '@/types/database';
import Card from '@/components/ui/card';
import {
  ArrowLeft,
  Users,
  Send,
  UserPlus,
  Phone,
  Wine,
  Package,
  Eye,
  ShoppingCart,
  Bell,
  Clock,
} from 'lucide-react';

type MemberWithContact = GroupMember & {
  contacts: Contact;
};

type GroupWithDetails = ContactGroup & {
  campaigns: Campaign & {
    offers: Offer;
  };
  group_members: MemberWithContact[];
};

function getStatusConfig(status: GroupMember['status']): {
  label: string;
  bg: string;
  text: string;
  icon: typeof Clock;
} {
  switch (status) {
    case 'pending':
      return {
        label: '\u00c0 contacter',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: Clock,
      };
    case 'invited':
      return {
        label: 'Invit\u00e9',
        bg: 'bg-blue-50',
        text: 'text-[#1B4965]',
        icon: Send,
      };
    case 'clicked':
      return {
        label: 'A cliqu\u00e9',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        icon: Eye,
      };
    case 'ordered':
      return {
        label: 'A command\u00e9',
        bg: 'bg-[#2D6A4F]/10',
        text: 'text-[#2D6A4F]',
        icon: ShoppingCart,
      };
    case 'to_remind':
      return {
        label: '\u00c0 relancer',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        icon: Bell,
      };
    case 'declined':
      return {
        label: 'D\u00e9clin\u00e9',
        bg: 'bg-red-50',
        text: 'text-[#722F37]',
        icon: Clock,
      };
    default:
      return {
        label: status,
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        icon: Clock,
      };
  }
}

function StatPill({
  label,
  count,
  bg,
  text,
}: {
  label: string;
  count: number;
  bg: string;
  text: string;
}) {
  if (count === 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${bg} ${text}`}
    >
      <span className="font-bold">{count}</span>
      {label}
    </span>
  );
}

export default async function GroupDetailPage({
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

  // Fetch group with members and campaign info
  const { data: group, error } = await supabase
    .from('contact_groups')
    .select(`
      *,
      campaigns (
        *,
        offers (*)
      ),
      group_members (
        *,
        contacts (*)
      )
    `)
    .eq('id', id)
    .eq('commissioner_id', user.id)
    .single();

  if (error || !group) {
    notFound();
  }

  const typedGroup = group as GroupWithDetails;
  const campaign = typedGroup.campaigns;
  const offer = campaign.offers;
  const members = typedGroup.group_members;

  const accentColor =
    offer.offer_type === 'domaines_villages' ? '#722F37' : '#2D6A4F';
  const OfferIcon =
    offer.offer_type === 'domaines_villages' ? Wine : Package;

  // Compute status stats
  const statusCounts: Record<string, number> = {};
  for (const member of members) {
    statusCounts[member.status] = (statusCounts[member.status] || 0) + 1;
  }

  const invited = statusCounts['invited'] || 0;
  const clicked = statusCounts['clicked'] || 0;
  const ordered = statusCounts['ordered'] || 0;
  const toRemind = statusCounts['to_remind'] || 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux groupes
      </Link>

      {/* Group info header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-[#1B4965]/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-[#1B4965]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {typedGroup.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${accentColor}15`,
                color: accentColor,
              }}
            >
              <OfferIcon className="w-3.5 h-3.5" />
              {campaign.name}
            </span>
            <span className="text-sm text-gray-500">
              {members.length} contact{members.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex flex-wrap gap-2">
        <StatPill
          label="invit\u00e9s"
          count={invited}
          bg="bg-blue-50"
          text="text-[#1B4965]"
        />
        <StatPill
          label="ont cliqu\u00e9"
          count={clicked}
          bg="bg-amber-50"
          text="text-amber-700"
        />
        <StatPill
          label="command\u00e9s"
          count={ordered}
          bg="bg-[#2D6A4F]/10"
          text="text-[#2D6A4F]"
        />
        <StatPill
          label="\u00e0 relancer"
          count={toRemind}
          bg="bg-orange-50"
          text="text-orange-700"
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/messages?campaign=${campaign.id}&group=${id}`}
          className="flex items-center justify-center gap-2 bg-[#1B4965] text-white px-4 py-3.5 rounded-xl font-semibold text-sm hover:bg-[#153a52] active:bg-[#0f2d40] transition-colors min-h-[52px]"
        >
          <Send className="w-4 h-4" />
          Envoyer les messages
        </Link>
        <Link
          href={`/groups/new?campaign=${campaign.id}`}
          className="flex items-center justify-center gap-2 border-2 border-[#1B4965] text-[#1B4965] px-4 py-3.5 rounded-xl font-semibold text-sm hover:bg-[#1B4965]/5 active:bg-[#1B4965]/10 transition-colors min-h-[52px]"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter des contacts
        </Link>
      </div>

      {/* Contact list */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Contacts ({members.length})
        </h2>

        {members.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">
                Aucun contact dans ce groupe
              </p>
              <Link
                href={`/groups/new?campaign=${campaign.id}`}
                className="inline-flex items-center gap-2 bg-[#1B4965] text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#153a52] transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Ajouter des contacts
              </Link>
            </div>
          </Card>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            {members.map((member) => {
              const contact = member.contacts;
              const statusConfig = getStatusConfig(member.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-500">
                      {contact.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>

                  {/* Contact info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {contact.full_name}
                    </p>
                    {contact.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`
                      inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0
                      ${statusConfig.bg} ${statusConfig.text}
                    `}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
