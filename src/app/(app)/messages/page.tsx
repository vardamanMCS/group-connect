'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatPhone } from '@/lib/utils';
import SmsSender from '@/components/sms-sender';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
  Smartphone,
  ArrowLeft,
  Plus,
  XCircle,
  Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageWithContact = {
  id: string;
  commissioner_id: string;
  contact_id: string;
  campaign_id: string;
  group_id: string | null;
  message_type: 'initial' | 'reminder_1' | 'reminder_2' | 'final' | 'custom';
  content: string;
  status: 'prepared' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
  contacts: {
    id: string;
    full_name: string;
    phone: string | null;
  };
  campaigns: {
    id: string;
    name: string;
  };
  contact_groups: {
    id: string;
    name: string;
  } | null;
};

type GroupMemberLookup = {
  id: string;
  contact_id: string;
  group_id: string;
};

type Tab = 'prepared' | 'sent' | 'all';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMessageTypeBadge(type: MessageWithContact['message_type']): {
  label: string;
  bg: string;
  text: string;
} {
  switch (type) {
    case 'initial':
      return { label: 'Initial', bg: 'bg-[#1B4965]/10', text: 'text-[#1B4965]' };
    case 'reminder_1':
      return { label: 'Relance 1', bg: 'bg-orange-50', text: 'text-orange-700' };
    case 'reminder_2':
      return { label: 'Relance 2', bg: 'bg-orange-100', text: 'text-orange-800' };
    case 'final':
      return {
        label: 'Derni\u00e8re',
        bg: 'bg-[#722F37]/10',
        text: 'text-[#722F37]',
      };
    case 'custom':
      return { label: 'Personnalis\u00e9', bg: 'bg-gray-100', text: 'text-gray-700' };
    default:
      return { label: type, bg: 'bg-gray-100', text: 'text-gray-600' };
  }
}

function getStatusBadge(status: MessageWithContact['status']): string {
  switch (status) {
    case 'prepared':
      return 'en-attente';
    case 'sent':
      return 'envoye';
    case 'failed':
      return 'annule';
    default:
      return status;
  }
}

function getStatusLabel(status: MessageWithContact['status']): string {
  switch (status) {
    case 'prepared':
      return 'Pr\u00eat';
    case 'sent':
      return 'Envoy\u00e9';
    case 'failed':
      return '\u00c9chou\u00e9';
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// SMS URI helper (same logic as sms-sender)
// ---------------------------------------------------------------------------

function getSmsUri(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    return `sms:${phone}&body=${encoded}`;
  }
  return `sms:${phone}?body=${encoded}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignFilter = searchParams.get('campaign');
  const groupFilter = searchParams.get('group');

  const [messages, setMessages] = useState<MessageWithContact[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMemberLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('prepared');
  const [userId, setUserId] = useState<string | null>(null);

  // Batch sending state
  const [batchSending, setBatchSending] = useState(false);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchConfirming, setBatchConfirming] = useState(false);
  const batchRef = useRef<MessageWithContact[]>([]);

  // -----------------------------------------------------------------------
  // Fetch data
  // -----------------------------------------------------------------------
  const fetchMessages = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;
    setUserId(user.id);

    let query = supabase
      .from('messages')
      .select(
        `
        *,
        contacts (id, full_name, phone),
        campaigns (id, name),
        contact_groups (id, name)
      `,
      )
      .eq('commissioner_id', user.id)
      .order('created_at', { ascending: false });

    if (campaignFilter) {
      query = query.eq('campaign_id', campaignFilter);
    }
    if (groupFilter) {
      query = query.eq('group_id', groupFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur chargement messages:', error);
    }

    setMessages((data as MessageWithContact[] | null) ?? []);

    // Also fetch group_members for updating status
    if (data && data.length > 0) {
      const groupIds = [
        ...new Set(
          data.filter((m: any) => m.group_id).map((m: any) => m.group_id),
        ),
      ];
      if (groupIds.length > 0) {
        const { data: members } = await supabase
          .from('group_members')
          .select('id, contact_id, group_id')
          .in('group_id', groupIds);
        setGroupMembers((members as GroupMemberLookup[] | null) ?? []);
      }
    }

    setLoading(false);
  }, [campaignFilter, groupFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // -----------------------------------------------------------------------
  // Find group_member ID for a message
  // -----------------------------------------------------------------------
  function findGroupMemberId(msg: MessageWithContact): string | undefined {
    if (!msg.group_id) return undefined;
    const member = groupMembers.find(
      (gm) => gm.group_id === msg.group_id && gm.contact_id === msg.contact_id,
    );
    return member?.id;
  }

  // -----------------------------------------------------------------------
  // Filtered messages
  // -----------------------------------------------------------------------
  const filteredMessages =
    activeTab === 'all'
      ? messages
      : messages.filter((m) => m.status === (activeTab === 'prepared' ? 'prepared' : 'sent'));

  const preparedCount = messages.filter((m) => m.status === 'prepared').length;
  const sentCount = messages.filter((m) => m.status === 'sent').length;

  // -----------------------------------------------------------------------
  // Batch send: opens each sms one by one
  // -----------------------------------------------------------------------
  const startBatchSend = useCallback(() => {
    const toSend = messages.filter(
      (m) => m.status === 'prepared' && m.contacts?.phone,
    );
    if (toSend.length === 0) return;

    batchRef.current = toSend;
    setBatchSending(true);
    setBatchIndex(0);

    // Open the first SMS
    const first = toSend[0];
    const uri = getSmsUri(first.contacts.phone!, first.content);
    window.location.href = uri;

    setTimeout(() => {
      setBatchConfirming(true);
    }, 2000);
  }, [messages]);

  const confirmBatchMessage = useCallback(async () => {
    setBatchConfirming(false);
    const supabase = createClient();
    const msg = batchRef.current[batchIndex];

    // Mark as sent
    await supabase
      .from('messages')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', msg.id);

    // Update group member
    if (msg.group_id) {
      const member = groupMembers.find(
        (gm) => gm.group_id === msg.group_id && gm.contact_id === msg.contact_id,
      );
      if (member) {
        await supabase
          .from('group_members')
          .update({ status: 'invited' })
          .eq('id', member.id);
      }
    }

    const nextIndex = batchIndex + 1;
    if (nextIndex < batchRef.current.length) {
      setBatchIndex(nextIndex);
      const next = batchRef.current[nextIndex];
      const uri = getSmsUri(next.contacts.phone!, next.content);
      window.location.href = uri;

      setTimeout(() => {
        setBatchConfirming(true);
      }, 2000);
    } else {
      // Batch complete
      setBatchSending(false);
      setBatchIndex(0);
      batchRef.current = [];
      fetchMessages();
    }
  }, [batchIndex, groupMembers, fetchMessages]);

  const skipBatchMessage = useCallback(() => {
    setBatchConfirming(false);
    const nextIndex = batchIndex + 1;
    if (nextIndex < batchRef.current.length) {
      setBatchIndex(nextIndex);
      const next = batchRef.current[nextIndex];
      const uri = getSmsUri(next.contacts.phone!, next.content);
      window.location.href = uri;

      setTimeout(() => {
        setBatchConfirming(true);
      }, 2000);
    } else {
      setBatchSending(false);
      setBatchIndex(0);
      batchRef.current = [];
      fetchMessages();
    }
  }, [batchIndex, fetchMessages]);

  const cancelBatch = useCallback(() => {
    setBatchSending(false);
    setBatchConfirming(false);
    setBatchIndex(0);
    batchRef.current = [];
    fetchMessages();
  }, [fetchMessages]);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#1B4965] animate-spin" />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1B4965]/10 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[#1B4965]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">
            {messages.length === 0
              ? 'Vos messages appara\u00eetront ici'
              : `${messages.length} message${messages.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {messages.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{preparedCount}</span>
            <span className="text-xs text-gray-500 mt-0.5">&agrave; envoyer</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{sentCount}</span>
            <span className="text-xs text-gray-500 mt-0.5">envoy&eacute;s</span>
          </div>
        </div>
      )}

      {/* Batch send button */}
      {preparedCount > 0 && !batchSending && (
        <button
          type="button"
          onClick={startBatchSend}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#2D6A4F] text-white px-4 py-4 rounded-xl font-semibold text-base hover:bg-[#245740] active:bg-[#1b4432] transition-colors min-h-[56px] shadow-sm"
        >
          <Send className="w-5 h-5" />
          Envoyer tous les SMS ({preparedCount})
        </button>
      )}

      {/* Batch sending overlay */}
      {batchSending && (
        <Card>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#1B4965]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-[#1B4965]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">
              Envoi en cours ({batchIndex + 1}/{batchRef.current.length})
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              {batchRef.current[batchIndex]?.contacts.full_name}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {batchRef.current[batchIndex]?.contacts.phone &&
                formatPhone(batchRef.current[batchIndex].contacts.phone!)}
            </p>

            {batchConfirming ? (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Avez-vous envoy&eacute; le SMS ?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={confirmBatchMessage}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#2D6A4F] text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-[#245740] active:bg-[#1b4432] transition-colors min-h-[48px]"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={skipBatchMessage}
                    className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[48px]"
                  >
                    Non, passer
                  </button>
                </div>
                <button
                  type="button"
                  onClick={cancelBatch}
                  className="mt-3 text-sm text-gray-500 underline min-h-[44px]"
                >
                  Arr&ecirc;ter l&apos;envoi
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-[#1B4965] animate-spin" />
                <span className="text-sm text-gray-500">
                  Ouverture de l&apos;app SMS...
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tabs */}
      {messages.length > 0 && (
        <div className="flex bg-white rounded-xl border border-gray-100 shadow-sm p-1">
          {(
            [
              { key: 'prepared', label: '\u00c0 envoyer', count: preparedCount },
              { key: 'sent', label: 'Envoy\u00e9s', count: sentCount },
              { key: 'all', label: 'Tous', count: messages.length },
            ] as { key: Tab; label: string; count: number }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors min-h-[44px]
                ${
                  activeTab === tab.key
                    ? 'bg-[#1B4965] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `.trim()}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {/* Messages list */}
      {messages.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Aucun message
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-2">
            Pour envoyer des SMS, commencez par pr&eacute;parer vos messages depuis une campagne.
          </p>
          <div className="text-sm text-gray-400 space-y-1 max-w-xs mx-auto mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p>
                Allez dans <span className="font-medium text-gray-600">Campagnes</span>, choisissez
                une campagne, puis pr&eacute;parez les messages pour un groupe de contacts.
              </p>
            </div>
          </div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 bg-[#1B4965] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#153a52] active:bg-[#0f2d40] transition-colors min-h-[48px]"
          >
            Voir les campagnes
          </Link>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            Aucun message dans cet onglet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((msg) => {
            if (msg.status === 'prepared' && msg.contacts?.phone) {
              // Use the SmsSender component for prepared messages
              return (
                <div key={msg.id}>
                  {/* Type badge + campaign info */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {(() => {
                      const badge = getMessageTypeBadge(msg.message_type);
                      return (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-gray-400 truncate">
                      {msg.campaigns.name}
                      {msg.contact_groups && ` \u2022 ${msg.contact_groups.name}`}
                    </span>
                  </div>
                  <SmsSender
                    phone={msg.contacts.phone}
                    message={msg.content}
                    contactName={msg.contacts.full_name}
                    messageId={msg.id}
                    groupMemberId={findGroupMemberId(msg)}
                    onSent={fetchMessages}
                  />
                </div>
              );
            }

            // Sent or failed messages display
            return (
              <div key={msg.id}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {(() => {
                    const badge = getMessageTypeBadge(msg.message_type);
                    return (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}
                  <span className="text-xs text-gray-400 truncate">
                    {msg.campaigns.name}
                    {msg.contact_groups && ` \u2022 ${msg.contact_groups.name}`}
                  </span>
                </div>
                <Card>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.status === 'sent'
                          ? 'bg-[#2D6A4F]/10'
                          : 'bg-red-50'
                      }`}
                    >
                      {msg.status === 'sent' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-[#722F37]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {msg.contacts.full_name}
                        </p>
                        <Badge status={getStatusBadge(msg.status)}>
                          {getStatusLabel(msg.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {msg.contacts.phone
                          ? formatPhone(msg.contacts.phone)
                          : 'Pas de num\u00e9ro'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {msg.content}
                      </p>
                      {msg.sent_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Envoy&eacute; le{' '}
                          {new Date(msg.sent_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
