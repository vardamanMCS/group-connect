'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatPhone } from '@/lib/utils';
import type {
  MessageTemplate,
  Campaign,
  ContactGroup,
  Contact,
  GroupMember,
  CommissionerCampaign,
} from '@/types/database';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import {
  ArrowLeft,
  MessageSquare,
  User,
  Pencil,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Send,
  Smartphone,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MemberWithContact = GroupMember & {
  contacts: Contact;
};

type TemplateOption = MessageTemplate;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStepLabel(
  step: MessageTemplate['step'],
): string {
  switch (step) {
    case 'initial':
      return 'Message initial';
    case 'reminder_1':
      return 'Relance 1';
    case 'reminder_2':
      return 'Relance 2';
    case 'final':
      return 'Derni\u00e8re relance';
    default:
      return step;
  }
}

function getStepMessageType(
  step: MessageTemplate['step'],
): 'initial' | 'reminder_1' | 'reminder_2' | 'final' {
  return step;
}

function personalizeMessage(
  template: string,
  contactName: string,
  shopUrl: string,
  offerName: string,
): string {
  // Extract first name from full_name
  const firstName = contactName.split(' ')[0] || contactName;

  return template
    .replace(/\{pr[eé]nom\}/gi, firstName)
    .replace(/\{lien_boutique\}/gi, shopUrl)
    .replace(/\{offre\}/gi, offerName);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PrepareMessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = searchParams.get('campaign');
  const groupId = searchParams.get('group');

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Data
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [offerName, setOfferName] = useState('');
  const [group, setGroup] = useState<ContactGroup | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [pendingMembers, setPendingMembers] = useState<MemberWithContact[]>([]);
  const [shopUrl, setShopUrl] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Customization
  const [customizing, setCustomizing] = useState(false);
  const [customContent, setCustomContent] = useState('');

  // Preview
  const [previewExpanded, setPreviewExpanded] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Fetch data
  // -----------------------------------------------------------------------
  useEffect(() => {
    async function fetchData() {
      if (!campaignId || !groupId) {
        setError('Param\u00e8tres manquants. Veuillez acc\u00e9der \u00e0 cette page depuis une campagne.');
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setUserId(user.id);

      // Fetch campaign with offer
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*, offers (name)')
        .eq('id', campaignId)
        .single();

      if (!campaignData) {
        setError('Campagne introuvable.');
        setLoading(false);
        return;
      }

      setCampaign(campaignData as Campaign);
      setOfferName((campaignData as any).offers?.name ?? '');

      // Fetch commissioner campaign for shop URL
      const { data: ccData } = await supabase
        .from('commissioner_campaigns')
        .select('personal_shop_url')
        .eq('campaign_id', campaignId)
        .eq('commissioner_id', user.id)
        .maybeSingle();

      setShopUrl(ccData?.personal_shop_url ?? '');

      // Fetch group
      const { data: groupData } = await supabase
        .from('contact_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (!groupData) {
        setError('Groupe introuvable.');
        setLoading(false);
        return;
      }

      setGroup(groupData as ContactGroup);

      // Fetch message templates for this campaign
      const { data: templateData } = await supabase
        .from('message_templates')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sort_order', { ascending: true });

      const tpls = (templateData as TemplateOption[] | null) ?? [];
      setTemplates(tpls);

      if (tpls.length > 0) {
        setSelectedTemplateId(tpls[0].id);
        setCustomContent(tpls[0].content);
      }

      // Fetch group members that are still pending (not yet contacted)
      const { data: membersData } = await supabase
        .from('group_members')
        .select('*, contacts (*)')
        .eq('group_id', groupId)
        .eq('status', 'pending');

      setPendingMembers((membersData as MemberWithContact[] | null) ?? []);
      setLoading(false);
    }

    fetchData();
  }, [campaignId, groupId]);

  // -----------------------------------------------------------------------
  // Selected template
  // -----------------------------------------------------------------------
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const effectiveContent = customizing
    ? customContent
    : selectedTemplate?.content ?? '';

  // -----------------------------------------------------------------------
  // Handle template change
  // -----------------------------------------------------------------------
  const handleTemplateChange = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
      const tpl = templates.find((t) => t.id === templateId);
      if (tpl) {
        setCustomContent(tpl.content);
      }
      setCustomizing(false);
    },
    [templates],
  );

  // -----------------------------------------------------------------------
  // Members with phone numbers
  // -----------------------------------------------------------------------
  const membersWithPhone = useMemo(
    () => pendingMembers.filter((m) => m.contacts?.phone),
    [pendingMembers],
  );

  const membersWithoutPhone = useMemo(
    () => pendingMembers.filter((m) => !m.contacts?.phone),
    [pendingMembers],
  );

  // -----------------------------------------------------------------------
  // Create message records
  // -----------------------------------------------------------------------
  const handlePrepare = useCallback(async () => {
    if (!userId || !campaignId || !groupId || !selectedTemplate) return;
    if (membersWithPhone.length === 0) return;

    setCreating(true);
    setError(null);

    const supabase = createClient();

    const messagesToInsert = membersWithPhone.map((member) => ({
      commissioner_id: userId,
      contact_id: member.contact_id,
      campaign_id: campaignId,
      group_id: groupId,
      message_type: getStepMessageType(selectedTemplate.step),
      content: personalizeMessage(
        effectiveContent,
        member.contacts.full_name,
        shopUrl,
        offerName,
      ),
      status: 'prepared' as const,
    }));

    const { error: insertError } = await supabase
      .from('messages')
      .insert(messagesToInsert);

    if (insertError) {
      console.error('Erreur lors de la creation des messages:', insertError);
      setError('Erreur lors de la pr\u00e9paration des messages. Veuillez r\u00e9essayer.');
      setCreating(false);
      return;
    }

    setSuccess(true);
    setCreating(false);

    // Redirect after a brief pause
    setTimeout(() => {
      router.push(`/messages?campaign=${campaignId}&group=${groupId}`);
    }, 1500);
  }, [
    userId,
    campaignId,
    groupId,
    selectedTemplate,
    membersWithPhone,
    effectiveContent,
    shopUrl,
    offerName,
    router,
  ]);

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#1B4965] animate-spin" />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------
  if (error && !campaign) {
    return (
      <div className="space-y-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Success state
  // -----------------------------------------------------------------------
  if (success) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-[#2D6A4F]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#2D6A4F]" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Messages pr&eacute;par&eacute;s !
        </h2>
        <p className="text-sm text-gray-500">
          {membersWithPhone.length} message
          {membersWithPhone.length > 1 ? 's' : ''}{' '}
          pr&ecirc;t{membersWithPhone.length > 1 ? 's' : ''} &agrave; envoyer.
        </p>
        <p className="text-sm text-gray-400 mt-1">Redirection en cours...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href={campaignId ? `/campaigns/${campaignId}` : '/campaigns'}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour &agrave; la campagne
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1B4965]/10 rounded-xl flex items-center justify-center">
          <Send className="w-5 h-5 text-[#1B4965]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Pr&eacute;parer les messages
          </h1>
          <p className="text-sm text-gray-500">
            {campaign?.name}
            {group && ` \u2022 ${group.name}`}
          </p>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#1B4965] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-semibold text-gray-900">
                {membersWithPhone.length} contact
                {membersWithPhone.length > 1 ? 's' : ''}
              </span>{' '}
              &agrave; contacter dans ce groupe.
            </p>
            {membersWithoutPhone.length > 0 && (
              <p className="mt-1 text-orange-600">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                {membersWithoutPhone.length} contact
                {membersWithoutPhone.length > 1 ? 's' : ''} sans num&eacute;ro
                de t&eacute;l&eacute;phone (ignor&eacute;
                {membersWithoutPhone.length > 1 ? 's' : ''}).
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Template selection */}
      {templates.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Mod&egrave;le de message
          </h2>
          <div className="space-y-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleTemplateChange(tpl.id)}
                className={`
                  w-full text-left p-4 rounded-xl border-2 transition-all min-h-[56px]
                  ${
                    selectedTemplateId === tpl.id
                      ? 'border-[#1B4965] bg-[#1B4965]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `.trim()}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-sm">
                    {tpl.title}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      selectedTemplateId === tpl.id
                        ? 'bg-[#1B4965]/10 text-[#1B4965]'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {getStepLabel(tpl.step)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{tpl.content}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {templates.length === 0 && (
        <Card>
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Aucun mod&egrave;le de message pour cette campagne.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Contactez votre administrateur pour ajouter des mod&egrave;les.
            </p>
          </div>
        </Card>
      )}

      {/* Customize toggle */}
      {selectedTemplate && (
        <section>
          <button
            type="button"
            onClick={() => {
              setCustomizing(!customizing);
              if (!customizing) {
                setCustomContent(selectedTemplate.content);
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B4965] min-h-[44px]"
          >
            <Pencil className="w-4 h-4" />
            {customizing
              ? 'Utiliser le mod\u00e8le original'
              : 'Personnaliser le message'}
          </button>

          {customizing && (
            <div className="mt-2">
              <textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 text-base bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4965]/30 focus:border-[#1B4965] transition-colors resize-none"
                placeholder="Saisissez votre message personnalis\u00e9..."
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Variables disponibles :{' '}
                <span className="font-mono bg-gray-100 px-1 rounded">
                  {'{pr\u00e9nom}'}
                </span>{' '}
                <span className="font-mono bg-gray-100 px-1 rounded">
                  {'{lien_boutique}'}
                </span>{' '}
                <span className="font-mono bg-gray-100 px-1 rounded">
                  {'{offre}'}
                </span>
              </p>
            </div>
          )}
        </section>
      )}

      {/* Preview section */}
      {selectedTemplate && membersWithPhone.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-bold text-gray-900">
              Aper&ccedil;u des messages
            </h2>
          </div>
          <div className="space-y-2">
            {membersWithPhone.slice(0, 5).map((member) => {
              const personalized = personalizeMessage(
                effectiveContent,
                member.contacts.full_name,
                shopUrl,
                offerName,
              );
              const isExpanded = previewExpanded === member.id;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() =>
                    setPreviewExpanded(isExpanded ? null : member.id)
                  }
                  className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition-all min-h-[56px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 bg-[#1B4965]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#1B4965]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {member.contacts.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.contacts.phone
                            ? formatPhone(member.contacts.phone)
                            : 'Pas de num\u00e9ro'}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="bg-[#F8F6F0] rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-400 font-medium">
                            Aper&ccedil;u SMS
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {personalized}
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
            {membersWithPhone.length > 5 && (
              <p className="text-xs text-gray-400 text-center py-2">
                ... et {membersWithPhone.length - 5} autre
                {membersWithPhone.length - 5 > 1 ? 's' : ''} contact
                {membersWithPhone.length - 5 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-[#722F37] px-4 py-3 rounded-xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Prepare button */}
      {selectedTemplate && membersWithPhone.length > 0 && (
        <div className="sticky bottom-20 z-10">
          <Button
            variant="primary"
            size="lg"
            loading={creating}
            onClick={handlePrepare}
            className="w-full shadow-lg"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Pr&eacute;parer {membersWithPhone.length} message
            {membersWithPhone.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
