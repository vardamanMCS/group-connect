import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Badge from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  Bell,
  ChevronRight,
  Phone,
  Clock,
  CheckCircle2,
  Megaphone,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReminderContact {
  memberId: string;
  memberStatus: string;
  contactId: string;
  contactName: string;
  contactPhone: string | null;
  campaignId: string;
  campaignName: string;
  groupId: string;
  groupName: string;
  offerName: string | null;
  offerColor: string | null;
  lastMessageSentAt: string | null;
  lastMessageType: string | null;
  daysSinceLastMessage: number;
}

// ---------------------------------------------------------------------------
// Helper: determine the next reminder step
// ---------------------------------------------------------------------------

function getNextStep(
  lastMessageType: string | null,
): 'reminder_1' | 'reminder_2' | 'final' {
  switch (lastMessageType) {
    case 'initial':
      return 'reminder_1';
    case 'reminder_1':
      return 'reminder_2';
    case 'reminder_2':
    case 'final':
    default:
      return 'final';
  }
}

function getNextStepLabel(lastMessageType: string | null): string {
  switch (lastMessageType) {
    case 'initial':
      return 'Relance 1';
    case 'reminder_1':
      return 'Relance 2';
    case 'reminder_2':
    case 'final':
    default:
      return 'Relance finale';
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function RemindersPage() {
  const supabase = await createClient();

  // --- Auth -----------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // --- Fetch group members that need reminding ------------------------------
  // We look for group_members with status 'to_remind' or 'invited'
  // We join through contact_groups to filter by commissioner_id
  const { data: membersData } = await supabase
    .from('group_members')
    .select(`
      id,
      status,
      contact_id,
      contacts (
        id,
        full_name,
        phone
      ),
      contact_groups!inner (
        id,
        name,
        commissioner_id,
        campaign_id,
        campaigns (
          id,
          name,
          offers (
            name,
            color
          )
        )
      )
    `)
    .eq('contact_groups.commissioner_id', user.id)
    .in('status', ['to_remind', 'invited']);

  // --- For each member, find the last sent message --------------------------
  const reminderContacts: ReminderContact[] = [];
  const now = new Date();

  for (const member of membersData ?? []) {
    const contact = member.contacts as unknown as {
      id: string;
      full_name: string;
      phone: string | null;
    };
    const group = member.contact_groups as unknown as {
      id: string;
      name: string;
      commissioner_id: string;
      campaign_id: string;
      campaigns: {
        id: string;
        name: string;
        offers: { name: string; color: string | null } | null;
      };
    };

    // Fetch the most recent sent message for this contact + campaign
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('sent_at, message_type')
      .eq('commissioner_id', user.id)
      .eq('contact_id', contact.id)
      .eq('campaign_id', group.campaign_id)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const sentAt = lastMessage?.sent_at ?? null;
    let daysSince = 0;

    if (sentAt) {
      const sentDate = new Date(sentAt);
      daysSince = Math.floor(
        (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    // For 'invited' status, only show if message was sent more than 3 days ago
    if (member.status === 'invited' && daysSince < 3) {
      continue;
    }

    reminderContacts.push({
      memberId: member.id,
      memberStatus: member.status as string,
      contactId: contact.id,
      contactName: contact.full_name,
      contactPhone: contact.phone,
      campaignId: group.campaign_id,
      campaignName: group.campaigns.name,
      groupId: group.id,
      groupName: group.name,
      offerName: group.campaigns.offers?.name ?? null,
      offerColor: group.campaigns.offers?.color ?? null,
      lastMessageSentAt: sentAt,
      lastMessageType: lastMessage?.message_type ?? null,
      daysSinceLastMessage: daysSince,
    });
  }

  // --- Group by campaign ----------------------------------------------------
  const campaignGroups: Record<
    string,
    { campaignName: string; offerName: string | null; offerColor: string | null; contacts: ReminderContact[] }
  > = {};

  for (const rc of reminderContacts) {
    if (!campaignGroups[rc.campaignId]) {
      campaignGroups[rc.campaignId] = {
        campaignName: rc.campaignName,
        offerName: rc.offerName,
        offerColor: rc.offerColor,
        contacts: [],
      };
    }
    campaignGroups[rc.campaignId].contacts.push(rc);
  }

  // Sort contacts within each group by days since last message (most urgent first)
  for (const key of Object.keys(campaignGroups)) {
    campaignGroups[key].contacts.sort(
      (a, b) => b.daysSinceLastMessage - a.daysSinceLastMessage,
    );
  }

  const totalToRemind = reminderContacts.length;
  const isEmpty = totalToRemind === 0;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Relances</h1>
          <p className="text-sm text-gray-500">
            {isEmpty
              ? 'Aucune relance en attente'
              : `${totalToRemind} contact${totalToRemind > 1 ? 's' : ''} ${totalToRemind > 1 ? 'a' : 'a'} relancer`}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats bar                                                          */}
      {/* ------------------------------------------------------------------ */}
      {!isEmpty && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-orange-700">
              {totalToRemind}
            </span>
          </div>
          <div>
            <p className="font-semibold text-orange-800">
              Contact{totalToRemind > 1 ? 's' : ''} en attente de relance
            </p>
            <p className="text-sm text-orange-600">
              Envoyez un rappel pour augmenter vos chances de commande
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Empty state                                                        */}
      {/* ------------------------------------------------------------------ */}
      {isEmpty && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#2D6A4F]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Aucune relance en attente
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            Bravo ! Tous vos contacts ont ete relances. Continuez a envoyer vos campagnes pour generer des commandes.
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
      {/* Contacts grouped by campaign                                       */}
      {/* ------------------------------------------------------------------ */}
      {Object.entries(campaignGroups).map(([campaignId, group]) => (
        <section key={campaignId}>
          {/* Campaign section header */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: group.offerColor ?? '#1B4965' }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">
                {group.campaignName}
              </h2>
              {group.offerName && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-0.5"
                  style={{
                    backgroundColor: `${group.offerColor ?? '#1B4965'}15`,
                    color: group.offerColor ?? '#1B4965',
                  }}
                >
                  {group.offerName}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-400 flex-shrink-0">
              {group.contacts.length} contact{group.contacts.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Contact cards */}
          <div className="space-y-2">
            {group.contacts.map((rc) => {
              const nextStep = getNextStep(rc.lastMessageType);
              const nextStepLabel = getNextStepLabel(rc.lastMessageType);

              return (
                <div
                  key={rc.memberId}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Contact info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {rc.contactName}
                      </h3>

                      {rc.contactPhone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5" />
                          {rc.contactPhone}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        {rc.groupName}
                      </p>

                      {/* Status line */}
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {rc.memberStatus === 'to_remind' ? (
                          <Badge status="en-attente">A relancer</Badge>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Invite il y a {rc.daysSinceLastMessage} jour{rc.daysSinceLastMessage > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {rc.lastMessageSentAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Dernier message : {formatDate(rc.lastMessageSentAt)}
                        </p>
                      )}
                    </div>

                    {/* Relancer button */}
                    <Link
                      href={`/messages?campaign=${rc.campaignId}&contact=${rc.contactId}&step=${nextStep}`}
                      className="
                        inline-flex items-center gap-1.5
                        bg-orange-50 text-orange-700
                        border border-orange-200
                        px-4 py-2.5 rounded-xl
                        text-sm font-semibold
                        hover:bg-orange-100 active:bg-orange-200
                        transition-colors duration-150
                        flex-shrink-0 min-h-[44px]
                      "
                    >
                      {nextStepLabel}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
