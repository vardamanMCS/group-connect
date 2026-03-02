'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, CheckCircle } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import type { AppSetting } from '@/types/database';

// ---------------------------------------------------------------------------
// Settings shape
// ---------------------------------------------------------------------------

interface SettingsState {
  commission_rate: string;
  support_phone: string;
  support_email: string;
  company_name: string;
}

const defaultSettings: SettingsState = {
  commission_rate: '10',
  support_phone: '03 80 12 34 56',
  support_email: 'support@maison-colin-seguin.fr',
  company_name: 'Maison Colin-Seguin',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminSettingsPage() {
  const supabase = createClient();

  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Load settings from app_settings table -------------------------------

  useEffect(() => {
    async function loadSettings() {
      const { data: rows } = await supabase
        .from('app_settings')
        .select('key, value');

      if (rows && rows.length > 0) {
        const loaded = { ...defaultSettings };
        for (const row of rows) {
          if (row.key in loaded) {
            loaded[row.key as keyof SettingsState] = String(
              typeof row.value === 'string' ? row.value : JSON.stringify(row.value),
            );
          }
        }
        setSettings(loaded);
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  // --- Save settings -------------------------------------------------------

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Get current user for updated_by
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const settingsToSave = Object.entries(settings) as [
        keyof SettingsState,
        string,
      ][];

      for (const [key, value] of settingsToSave) {
        // Check if the setting already exists
        const { data: existing } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', key)
          .maybeSingle();

        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('app_settings')
            .update({
              value: value as unknown as import('@/types/database').Json,
              updated_at: new Date().toISOString(),
              updated_by: user?.id ?? null,
            })
            .eq('key', key);

          if (updateError) throw updateError;
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from('app_settings')
            .insert({
              key,
              value: value as unknown as import('@/types/database').Json,
              description: `Setting: ${key}`,
              updated_by: user?.id ?? null,
            });

          if (insertError) throw insertError;
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la sauvegarde.',
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B4965]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configuration generale de l&apos;application
        </p>
      </div>

      {/* Settings form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Company settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              Informations entreprise
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="company-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom de l&apos;entreprise
              </label>
              <input
                id="company-name"
                type="text"
                value={settings.company_name}
                onChange={(e) =>
                  setSettings({ ...settings, company_name: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Commission settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Commission
          </h2>

          <div>
            <label
              htmlFor="commission-rate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Taux de commission par defaut (%)
            </label>
            <div className="relative w-40">
              <input
                id="commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.commission_rate}
                onChange={(e) =>
                  setSettings({ ...settings, commission_rate: e.target.value })
                }
                className="w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                %
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Ce taux sera applique par defaut aux nouvelles campagnes
            </p>
          </div>
        </div>

        {/* Support contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Contact support
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="support-phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Telephone support
              </label>
              <input
                id="support-phone"
                type="tel"
                value={settings.support_phone}
                onChange={(e) =>
                  setSettings({ ...settings, support_phone: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="support-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email support
              </label>
              <input
                id="support-email"
                type="email"
                value={settings.support_email}
                onChange={(e) =>
                  setSettings({ ...settings, support_email: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Error / Success messages */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            Parametres enregistres avec succes
          </div>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1B4965] text-white text-sm font-medium rounded-lg hover:bg-[#153a52] transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Enregistrer les parametres
        </button>
      </form>
    </div>
  );
}
