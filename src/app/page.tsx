'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wine, Users, ContactRound, Send, BarChart3, ChevronDown } from 'lucide-react'

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-medium text-gray-900"
        aria-expanded={open}
      >
        <span>{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 w-full max-w-lg mx-auto px-5 py-8">
        {/* Hero Section */}
        <section className="text-center pt-8 pb-10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary">
              <Wine className="h-7 w-7 text-white" />
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-wine">
              <Users className="h-7 w-7 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Group Connect
          </h1>
          <p className="mt-1 text-base text-wine font-medium">
            Application regroupeur
          </p>

          <p className="mt-5 text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
            Simplifiez votre travail de commissionnaire. Animez vos campagnes de vente,
            suivez vos contacts et g&eacute;rez vos commissions en toute simplicit&eacute;.
          </p>

          {/* CTA Button */}
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center w-full max-w-xs h-14 rounded-xl bg-primary text-white text-lg font-semibold shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-[0.98] transition-all duration-150"
          >
            Acc&eacute;der &agrave; mon espace
          </Link>
        </section>

        {/* Feature Cards */}
        <section className="pb-10">
          <div className="space-y-3">
            <div className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary/10 shrink-0">
                <ContactRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">G&eacute;rez vos contacts</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  Retrouvez facilement tous vos clients et leurs informations en un seul endroit.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-wine/10 shrink-0">
                <Send className="h-5 w-5 text-wine" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Envoyez vos campagnes</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  Cr&eacute;ez et envoyez vos offres en quelques clics directement depuis votre t&eacute;l&eacute;phone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-green/10 shrink-0">
                <BarChart3 className="h-5 w-5 text-green" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Suivez vos commissions</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  Consultez vos r&eacute;sultats et vos commissions en temps r&eacute;el.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="pb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Questions fr&eacute;quentes
          </h2>
          <div className="space-y-3">
            <FAQItem
              question="Qu'est-ce que Group Connect ?"
              answer="Group Connect est l'application officielle de la Maison Colin-Seguin pour ses commissionnaires. Elle vous permet de g&eacute;rer vos contacts clients, d'envoyer des campagnes de vente group&eacute;e et de suivre vos commissions, le tout depuis votre t&eacute;l&eacute;phone."
            />
            <FAQItem
              question="Comment &ccedil;a marche ?"
              answer="C'est tr&egrave;s simple : connectez-vous avec votre num&eacute;ro de t&eacute;l&eacute;phone, puis acc&eacute;dez &agrave; votre espace. Vous pourrez g&eacute;rer vos contacts, envoyer des campagnes et consulter vos commissions en quelques clics."
            />
            <FAQItem
              question="Est-ce gratuit ?"
              answer="Oui, Group Connect est enti&egrave;rement gratuit pour tous les commissionnaires de la Maison Colin-Seguin. L'application est mise &agrave; votre disposition pour faciliter votre travail au quotidien."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-lg mx-auto px-5 pb-8 pt-4">
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Maison Colin-Seguin. Tous droits r&eacute;serv&eacute;s.
          </p>
        </div>
      </footer>
    </div>
  )
}
