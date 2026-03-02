'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Campaign, Offer, Contact } from '@/types/database';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card from '@/components/ui/card';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Wine,
  Package,
  Users,
  UserPlus,
  Phone,
  Smartphone,
  X,
  Plus,
} from 'lucide-react';

type CampaignOption = Campaign & {
  offers: Offer;
};

type SelectedContact = {
  id?: string;
  full_name: string;
  phone: string;
  isNew?: boolean;
};

const STEPS = [
  { number: 1, label: 'Campagne' },
  { number: 2, label: 'Nom' },
  { number: 3, label: 'Contacts' },
  { number: 4, label: 'Confirmer' },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${
                  currentStep > step.number
                    ? 'bg-[#2D6A4F] text-white'
                    : currentStep === step.number
                      ? 'bg-[#1B4965] text-white'
                      : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {currentStep > step.number ? (
                <Check className="w-4 h-4" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-xs mt-1 ${
                currentStep >= step.number
                  ? 'text-gray-700 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-1 mb-5 ${
                currentStep > step.number ? 'bg-[#2D6A4F]' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function NewGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCampaignId = searchParams.get('campaign');

  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(
    preselectedCampaignId ? 2 : 1
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Campaign selection
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    preselectedCampaignId
  );
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Step 2: Group name
  const [groupName, setGroupName] = useState('');

  // Step 3: Contacts
  const [existingContacts, setExistingContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>(
    []
  );
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Fetch campaigns on mount
  useEffect(() => {
    async function fetchCampaigns() {
      setLoadingCampaigns(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('commissioner_campaigns')
        .select(`
          campaign_id,
          status,
          campaigns (
            *,
            offers (*)
          )
        `)
        .eq('commissioner_id', user.id)
        .eq('status', 'active');

      if (data) {
        const campaignOptions = data
          .map(
            (cc: Record<string, unknown>) => cc.campaigns as CampaignOption
          )
          .filter(Boolean) as CampaignOption[];
        setCampaigns(campaignOptions);

        // Set name suggestion if campaign preselected
        if (preselectedCampaignId) {
          const campaign = campaignOptions.find(
            (c) => c.id === preselectedCampaignId
          );
          if (campaign) {
            setGroupName(`${campaign.name} - Groupe 1`);
          }
        }
      }
      setLoadingCampaigns(false);
    }
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch existing contacts when reaching step 3
  useEffect(() => {
    async function fetchContacts() {
      setLoadingContacts(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('commissioner_id', user.id)
        .order('full_name', { ascending: true });

      if (data) {
        setExistingContacts(data);
      }
      setLoadingContacts(false);
    }
    if (currentStep === 3) {
      fetchContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  function handleSelectCampaign(campaignId: string) {
    setSelectedCampaignId(campaignId);
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign && !groupName) {
      setGroupName(`${campaign.name} - Groupe 1`);
    }
    setCurrentStep(2);
  }

  function toggleContact(contact: Contact) {
    setSelectedContacts((prev) => {
      const exists = prev.find((c) => c.id === contact.id);
      if (exists) {
        return prev.filter((c) => c.id !== contact.id);
      }
      return [
        ...prev,
        {
          id: contact.id,
          full_name: contact.full_name,
          phone: contact.phone || '',
        },
      ];
    });
  }

  function handleAddManualContact() {
    if (!newContactName.trim()) return;
    setSelectedContacts((prev) => [
      ...prev,
      {
        full_name: newContactName.trim(),
        phone: newContactPhone.trim(),
        isNew: true,
      },
    ]);
    setNewContactName('');
    setNewContactPhone('');
    setShowManualEntry(false);
  }

  function handleRemoveContact(index: number) {
    setSelectedContacts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImportFromPhone() {
    try {
      // Check if Contact Picker API is available
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const contacts = await (navigator as any).contacts.select(
          ['name', 'tel'],
          { multiple: true }
        );

        if (contacts && contacts.length > 0) {
          const imported: SelectedContact[] = contacts.map(
            (c: { name?: string[]; tel?: string[] }) => ({
              full_name: c.name?.[0] || 'Sans nom',
              phone: c.tel?.[0] || '',
              isNew: true,
            })
          );
          setSelectedContacts((prev) => [...prev, ...imported]);
        }
      } else {
        // Fallback to manual entry
        setShowManualEntry(true);
      }
    } catch {
      // User cancelled or API not available, show manual entry
      setShowManualEntry(true);
    }
  }

  async function handleCreateGroup() {
    if (
      !selectedCampaignId ||
      !groupName.trim() ||
      selectedContacts.length === 0
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      // Create new contacts that don't exist yet
      const contactIds: string[] = [];

      for (const contact of selectedContacts) {
        if (contact.id) {
          contactIds.push(contact.id);
        } else {
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              commissioner_id: user.id,
              full_name: contact.full_name,
              phone: contact.phone || null,
            })
            .select('id')
            .single();

          if (contactError) throw contactError;
          if (newContact) contactIds.push(newContact.id);
        }
      }

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('contact_groups')
        .insert({
          commissioner_id: user.id,
          campaign_id: selectedCampaignId,
          name: groupName.trim(),
        })
        .select('id')
        .single();

      if (groupError) throw groupError;
      if (!group) throw new Error('Erreur lors de la creation du groupe');

      // Add members
      const members = contactIds.map((contactId) => ({
        group_id: group.id,
        contact_id: contactId,
        status: 'pending' as const,
      }));

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(members);

      if (membersError) throw membersError;

      // Redirect to the new group
      router.push(`/groups/${group.id}`);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">
          Cr&eacute;er un groupe
        </h1>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step 1: Choose Campaign */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Choisissez une campagne
            </h2>
            <p className="text-sm text-gray-500">
              S&eacute;lectionnez la campagne pour ce groupe
            </p>
          </div>

          {loadingCampaigns ? (
            <div className="text-center py-12 text-gray-500">
              Chargement...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Aucune campagne active. Activez d&apos;abord une campagne.
              </p>
              <Link href="/campaigns" className="text-[#1B4965] font-semibold">
                Voir les campagnes
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const accentColor =
                  campaign.offers.offer_type === 'domaines_villages'
                    ? '#722F37'
                    : '#2D6A4F';
                const OfferIcon =
                  campaign.offers.offer_type === 'domaines_villages'
                    ? Wine
                    : Package;

                return (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => handleSelectCampaign(campaign.id)}
                    className={`
                      w-full bg-white rounded-2xl border-2 p-4 text-left
                      transition-all duration-150
                      hover:shadow-md active:scale-[0.99]
                      ${
                        selectedCampaignId === campaign.id
                          ? 'border-[#1B4965] shadow-md'
                          : 'border-gray-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${accentColor}15` }}
                      >
                        <OfferIcon
                          className="w-5 h-5"
                          style={{ color: accentColor }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {campaign.offers.name}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Name the group */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Nommez votre groupe
            </h2>
            <p className="text-sm text-gray-500">
              Donnez un nom facile &agrave; retenir
            </p>
          </div>

          {selectedCampaign && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100">
              {selectedCampaign.offers.offer_type === 'domaines_villages' ? (
                <Wine className="w-4 h-4 text-[#722F37]" />
              ) : (
                <Package className="w-4 h-4 text-[#2D6A4F]" />
              )}
              <span className="text-sm text-gray-700">
                {selectedCampaign.name}
              </span>
            </div>
          )}

          <Input
            label="Nom du groupe"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Ex: Famille, Amis proches, Collegues..."
            autoFocus
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setCurrentStep(1)}
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentStep(3)}
              disabled={!groupName.trim()}
              className="flex-1"
            >
              Continuer
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Select contacts */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Ajoutez des contacts
            </h2>
            <p className="text-sm text-gray-500">
              S&eacute;lectionnez ou importez vos contacts
            </p>
          </div>

          {/* Selected contacts summary */}
          {selectedContacts.length > 0 && (
            <div className="bg-[#1B4965]/5 rounded-xl p-3">
              <p className="text-sm font-semibold text-[#1B4965] mb-2">
                {selectedContacts.length} contact
                {selectedContacts.length > 1 ? 's' : ''}{' '}
                s&eacute;lectionn&eacute;
                {selectedContacts.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedContacts.map((contact, index) => (
                  <span
                    key={contact.id || `new-${index}`}
                    className="inline-flex items-center gap-1 bg-white text-sm text-gray-700 px-2.5 py-1 rounded-full border border-gray-200"
                  >
                    {contact.full_name}
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(index)}
                      className="text-gray-400 hover:text-red-500 p-0.5"
                      aria-label={`Retirer ${contact.full_name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Import from phone */}
          <button
            type="button"
            onClick={handleImportFromPhone}
            className="w-full flex items-center gap-3 bg-white border-2 border-dashed border-[#1B4965]/30 rounded-xl p-4 text-left hover:border-[#1B4965] hover:bg-[#1B4965]/5 transition-all min-h-[56px]"
          >
            <div className="w-10 h-10 bg-[#1B4965]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-[#1B4965]" />
            </div>
            <div>
              <span className="font-semibold text-[#1B4965] text-sm">
                Importer depuis mon t&eacute;l&eacute;phone
              </span>
              <p className="text-xs text-gray-500">
                Acc&eacute;dez &agrave; vos contacts directement
              </p>
            </div>
          </button>

          {/* Manual entry toggle */}
          <button
            type="button"
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 transition-all min-h-[56px]"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <span className="font-semibold text-gray-700 text-sm">
                Ajouter manuellement
              </span>
              <p className="text-xs text-gray-500">
                Saisissez un nom et un num&eacute;ro
              </p>
            </div>
          </button>

          {/* Manual entry form */}
          {showManualEntry && (
            <Card>
              <div className="space-y-3">
                <Input
                  label="Nom"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Pr\u00e9nom Nom"
                  autoFocus
                />
                <Input
                  label="T\u00e9l\u00e9phone"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  type="tel"
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowManualEntry(false);
                      setNewContactName('');
                      setNewContactPhone('');
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddManualContact}
                    disabled={!newContactName.trim()}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Existing contacts list */}
          {existingContacts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Vos contacts existants
              </h3>
              <div className="space-y-0 bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {existingContacts.map((contact) => {
                  const isSelected = selectedContacts.some(
                    (c) => c.id === contact.id
                  );
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => toggleContact(contact)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left
                        transition-colors min-h-[52px]
                        ${isSelected ? 'bg-[#1B4965]/5' : 'hover:bg-gray-50'}
                      `}
                    >
                      <div
                        className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                          ${
                            isSelected
                              ? 'bg-[#1B4965] border-[#1B4965]'
                              : 'border-gray-300'
                          }
                        `}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loadingContacts && (
            <div className="text-center py-8 text-gray-500">
              Chargement des contacts...
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setCurrentStep(2)}
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentStep(4)}
              disabled={selectedContacts.length === 0}
              className="flex-1"
            >
              Continuer
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Confirmer la cr&eacute;ation
            </h2>
            <p className="text-sm text-gray-500">
              V&eacute;rifiez les informations avant de cr&eacute;er
            </p>
          </div>

          {/* Summary */}
          <Card>
            <div className="space-y-4">
              {/* Campaign */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Campagne
                </p>
                <div className="flex items-center gap-2">
                  {selectedCampaign?.offers.offer_type ===
                  'domaines_villages' ? (
                    <Wine className="w-4 h-4 text-[#722F37]" />
                  ) : (
                    <Package className="w-4 h-4 text-[#2D6A4F]" />
                  )}
                  <span className="font-medium text-gray-900">
                    {selectedCampaign?.name}
                  </span>
                </div>
              </div>

              {/* Group name */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Nom du groupe
                </p>
                <p className="font-medium text-gray-900">{groupName}</p>
              </div>

              {/* Contacts */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Contacts ({selectedContacts.length})
                </p>
                <div className="space-y-1.5">
                  {selectedContacts.map((contact, index) => (
                    <div
                      key={contact.id || `new-${index}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-900">
                        {contact.full_name}
                      </span>
                      {contact.isNew && (
                        <span className="text-xs bg-blue-50 text-[#1B4965] px-1.5 py-0.5 rounded">
                          Nouveau
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setCurrentStep(3)}
              disabled={loading}
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              variant="success"
              size="lg"
              onClick={handleCreateGroup}
              loading={loading}
              className="flex-1"
            >
              <Check className="w-5 h-5 mr-1" />
              Cr&eacute;er le groupe
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
