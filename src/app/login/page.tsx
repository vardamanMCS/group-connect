'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wine, Users, ArrowLeft, Loader2, Phone, KeyRound, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Step = 'phone' | 'otp' | 'success' | 'email' | 'email-sent'
type AuthMode = 'phone' | 'email'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [authMode, setAuthMode] = useState<AuthMode>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPhoneForDisplay = (value: string) => {
    // Allow only digits and leading +
    const cleaned = value.replace(/[^\d+]/g, '')
    return cleaned
  }

  const getFullPhone = (input: string): string => {
    const cleaned = input.replace(/\s/g, '')
    // If user typed a French number without country code, add +33
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '+33' + cleaned.slice(1)
    }
    // If already has country code
    if (cleaned.startsWith('+')) {
      return cleaned
    }
    // Default: assume French number
    return '+33' + cleaned
  }

  const handleSendEmailLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      setStep('email-sent')
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const fullPhone = getFullPhone(phone)

      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      setStep('otp')
    } catch {
      setError('Une erreur est survenue. Veuillez r\u00e9essayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const fullPhone = getFullPhone(phone)

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      })

      if (verifyError) {
        setError(verifyError.message)
        return
      }

      setStep('success')
      // Small delay so user sees success, then redirect
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch {
      setError('Une erreur est survenue. Veuillez r\u00e9essayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 w-full max-w-lg mx-auto px-5 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
            <Wine className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-wine">
            <Users className="h-6 w-6 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Connectez-vous
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          Entrez votre num&eacute;ro de t&eacute;l&eacute;phone pour acc&eacute;der &agrave; votre espace
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Mode Toggle */}
        {(step === 'phone' || step === 'email') && (
          <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => { setAuthMode('phone'); setStep('phone'); setError(null) }}
              className={`flex-1 flex items-center justify-center gap-2 h-12 text-sm font-medium transition-colors ${authMode === 'phone' ? 'bg-[#1B4965] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              <Phone className="h-4 w-4" />
              Par téléphone
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('email'); setStep('email'); setError(null) }}
              className={`flex-1 flex items-center justify-center gap-2 h-12 text-sm font-medium transition-colors ${authMode === 'email' ? 'bg-[#1B4965] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              <Mail className="h-4 w-4" />
              Par email
            </button>
          </div>
        )}

        {/* Step: Phone Input */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Numéro de téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="06 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneForDisplay(e.target.value))}
                  required
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-300 bg-white text-base text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Format : 06 12 34 56 78 ou +33 6 12 34 56 78
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phone}
              className="flex items-center justify-center w-full h-14 rounded-xl bg-[#1B4965] text-white text-base font-semibold shadow-lg shadow-[#1B4965]/20 hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Recevoir mon code par SMS'
              )}
            </button>
          </form>
        )}

        {/* Step: Email Input */}
        {step === 'email' && (
          <form onSubmit={handleSendEmailLink} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-300 bg-white text-base text-gray-900 placeholder-gray-400 focus:border-[#1B4965] focus:ring-2 focus:ring-[#1B4965]/20 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="flex items-center justify-center w-full h-14 rounded-xl bg-[#1B4965] text-white text-base font-semibold shadow-lg shadow-[#1B4965]/20 hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Recevoir mon lien de connexion'
              )}
            </button>
          </form>
        )}

        {/* Step: Email Sent */}
        {step === 'email-sent' && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#2D6A4F]/10 mx-auto mb-4">
              <Mail className="h-8 w-8 text-[#2D6A4F]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Email envoyé !
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Un lien de connexion a été envoyé à <strong>{email}</strong>.
              Ouvrez votre boîte mail et cliquez sur le lien pour vous connecter.
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Pensez à vérifier vos spams si vous ne trouvez pas l&apos;email.
            </p>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(null) }}
              className="text-sm text-[#1B4965] hover:underline"
            >
              Renvoyer un email ou changer d&apos;adresse
            </button>
          </div>
        )}

        {/* Step: OTP Verification */}
        {step === 'otp' && (
          <div>
            <div className="mb-6 rounded-xl bg-green/5 border border-green/20 px-4 py-3 text-sm text-green">
              Un SMS avec votre code de connexion vous a &eacute;t&eacute; envoy&eacute;.
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Code de v&eacute;rification
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^\d]/g, '').slice(0, 6))
                    }
                    required
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-300 bg-white text-center text-2xl font-mono tracking-[0.5em] text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Entrez le code &agrave; 6 chiffres re&ccedil;u par SMS
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex items-center justify-center w-full h-14 rounded-xl bg-primary text-white text-base font-semibold shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Valider le code'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setError(null)
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Renvoyer un code ou changer de num&eacute;ro
              </button>
            </form>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green/10 mx-auto mb-4">
              <svg
                className="h-8 w-8 text-green"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Connexion r&eacute;ussie !
            </h2>
            <p className="text-gray-500 text-sm">
              Redirection vers votre espace...
            </p>
            <div className="mt-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
