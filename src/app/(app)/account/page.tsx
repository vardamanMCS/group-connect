'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Megaphone,
  TrendingUp,
  LogOut,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, formatPhone, getInitials } from '@/lib/utils';
import type { Profile } from '@/types/database';

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Stats
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [totalCommissions, setTotalCommissions] = useState(0);

  // Edit form
  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditName(profileData.full_name ?? '');
        setEditPhone(profileData.phone ?? '');
        setEditEmail(profileData.email ?? '');
        setEditCity(profileData.city ?? '');
      }

      // Fetch campaigns count
      const { count: campCount } = await supabase
        .from('commissioner_campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('commissioner_id', user.id);

      setCampaignsCount(campCount ?? 0);

      // Fetch total commissions
      const { data: commissionRows } = await supabase
        .from('commissions')
        .select('amount')
        .eq('commissioner_id', user.id);

      const total = (commissionRows ?? []).reduce(
        (sum, row) => sum + (row.amount ?? 0),
        0,
      );
      setTotalCommissions(total);

      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSaveSuccess(false);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editName || null,
        phone: editPhone || null,
        email: editEmail || null,
        city: editCity || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (!error) {
      setProfile({
        ...profile,
        full_name: editName || null,
        phone: editPhone || null,
        email: editEmail || null,
        city: editCity || null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B4965]" />
      </div>
    );
  }

  const displayName = profile?.full_name ?? 'Commissionnaire';
  const initials = profile?.full_name ? getInitials(profile.full_name) : 'C';

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Profile Section                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 bg-[#1B4965] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {displayName}
            </h1>

            {profile?.phone && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <Phone className="w-3.5 h-3.5" />
                {formatPhone(profile.phone)}
              </p>
            )}

            {profile?.email && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{profile.email}</span>
              </p>
            )}

            {profile?.city && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {profile.city}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Edit Profile (expandable)                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowEditForm(!showEditForm)}
          className="flex items-center justify-between w-full px-6 py-4 text-left"
        >
          <span className="font-semibold text-gray-900">
            Modifier mon profil
          </span>
          {showEditForm ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showEditForm && (
          <form onSubmit={handleSaveProfile} className="px-6 pb-6 space-y-4">
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom complet
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-white text-base text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Telephone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Phone className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="edit-phone"
                  type="tel"
                  inputMode="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-white text-base text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="edit-email"
                  type="email"
                  inputMode="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="jean@exemple.fr"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-white text-base text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-city"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ville
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="edit-city"
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Lyon"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-white text-base text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 px-4 py-3 text-sm text-[#2D6A4F] font-medium">
                Profil mis a jour avec succes !
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#1B4965] text-white text-sm font-semibold hover:bg-[#153a52] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats Summary                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Votre activite
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1B4965]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-[#1B4965]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Membre depuis</p>
              <p className="font-semibold text-gray-900">
                {profile?.created_at
                  ? formatDate(profile.created_at)
                  : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#722F37]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5 text-[#722F37]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Campagnes participees</p>
              <p className="font-semibold text-gray-900">{campaignsCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-[#2D6A4F]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Commissions totales</p>
              <p className="font-semibold text-[#2D6A4F]">
                {formatCurrency(totalCommissions)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Help link                                                          */}
      {/* ------------------------------------------------------------------ */}
      <Link
        href="/help"
        className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
      >
        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Besoin d&apos;aide ?</p>
          <p className="text-sm text-gray-500">
            FAQ, tutoriels et contact support
          </p>
        </div>
      </Link>

      {/* ------------------------------------------------------------------ */}
      {/* Sign Out                                                           */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
      >
        {signingOut ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <LogOut className="w-5 h-5" />
            Se deconnecter
          </>
        )}
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* App Version                                                        */}
      {/* ------------------------------------------------------------------ */}
      <p className="text-center text-xs text-gray-400 pb-4">
        Group Connect v0.1.0 - Maison Colin-Seguin
      </p>
    </div>
  );
}
