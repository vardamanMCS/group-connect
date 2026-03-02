import {
  HelpCircle,
  ChevronDown,
  Phone,
  Mail,
  BookOpen,
  Users,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Wrench,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// FAQ Data
// ---------------------------------------------------------------------------

interface FaqItem {
  question: string;
  answer: string;
  icon: typeof HelpCircle;
}

const faqItems: FaqItem[] = [
  {
    question: 'Comment creer un groupe ?',
    answer:
      'C\'est tres simple ! Allez sur une campagne active, puis appuyez sur "Creer un groupe". ' +
      'Donnez un nom a votre groupe (par exemple "Famille", "Amis", "Collegues"), ' +
      'puis ajoutez vos contacts. Vous pourrez ensuite leur envoyer des messages facilement.',
    icon: Users,
  },
  {
    question: 'Comment envoyer un SMS ?',
    answer:
      'Une fois votre groupe cree avec des contacts, allez dans votre campagne et ' +
      'choisissez le groupe. Appuyez sur "Envoyer un message". ' +
      'Un message pre-rempli vous sera propose avec votre lien personnel. ' +
      'Vous n\'avez plus qu\'a l\'envoyer ! Le message s\'ouvrira dans votre application SMS.',
    icon: MessageSquare,
  },
  {
    question: 'Comment suivre mes commissions ?',
    answer:
      'Vos commissions sont affichees directement sur la page d\'accueil avec la jauge de progression. ' +
      'Vous pouvez voir le detail dans chaque campagne. ' +
      'Les commissions passent par 3 etapes : estimee, validee, puis versee. ' +
      'Vous recevrez une notification a chaque changement.',
    icon: TrendingUp,
  },
  {
    question: 'Comment ajouter des contacts ?',
    answer:
      'Allez dans un groupe et appuyez sur "Ajouter un contact". ' +
      'Entrez le nom et le numero de telephone de votre contact. ' +
      'Vous pouvez aussi ajouter un email et des notes. ' +
      'Vos contacts sont prives et ne sont visibles que par vous.',
    icon: UserPlus,
  },
  {
    question: 'J\'ai un probleme technique',
    answer:
      'Pas de panique ! Essayez d\'abord de fermer et rouvrir l\'application. ' +
      'Si le probleme persiste, contactez notre support par telephone ou par email ' +
      '(voir les coordonnees ci-dessous). ' +
      'Nous sommes la pour vous aider et nous repondons rapidement.',
    icon: Wrench,
  },
];

// ---------------------------------------------------------------------------
// FAQ Accordion Item (server component using <details>)
// ---------------------------------------------------------------------------

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const Icon = item.icon;

  return (
    <details className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="w-9 h-9 bg-[#1B4965]/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon className="w-4.5 h-4.5 text-[#1B4965]" />
        </div>
        <span className="flex-1 font-semibold text-gray-900 text-sm">
          {item.question}
        </span>
        <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5 pt-1">
        <p className="text-sm text-gray-600 leading-relaxed pl-12">
          {item.answer}
        </p>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Besoin d&apos;aide ?
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Trouvez rapidement des reponses a vos questions
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ Accordion                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Questions frequentes
        </h2>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <FaqAccordionItem key={index} item={item} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Getting Started Guide                                              */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Guide de demarrage
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-[#2D6A4F]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Premiers pas avec Group Connect
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Suivez ces etapes pour bien commencer
              </p>
            </div>
          </div>

          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#1B4965] rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                1
              </span>
              <p>
                <strong>Completez votre profil</strong> dans l&apos;onglet
                Compte avec votre nom et votre ville.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#1B4965] rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                2
              </span>
              <p>
                <strong>Decouvrez vos campagnes</strong> dans l&apos;onglet
                Campagnes. Activez celles qui vous interessent.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#1B4965] rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                3
              </span>
              <p>
                <strong>Creez vos groupes</strong> de contacts : famille, amis,
                collegues... Organisez comme vous voulez !
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#1B4965] rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                4
              </span>
              <p>
                <strong>Envoyez vos messages</strong> avec votre lien personnel.
                Chaque commande sera automatiquement associee a vous.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#2D6A4F] rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                5
              </span>
              <p>
                <strong>Suivez vos commissions</strong> en temps reel sur la
                page d&apos;accueil. C&apos;est aussi simple que ca !
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Contact Support                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Contacter le support
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-600 mb-4">
            Notre equipe est disponible du lundi au vendredi de 9h a 18h pour
            vous accompagner.
          </p>

          <div className="space-y-3">
            <a
              href="tel:+33380123456"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#1B4965]/5 hover:bg-[#1B4965]/10 transition-colors"
            >
              <div className="w-10 h-10 bg-[#1B4965] rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Par telephone
                </p>
                <p className="text-sm text-[#1B4965]">03 80 12 34 56</p>
              </div>
            </a>

            <a
              href="mailto:support@maison-colin-seguin.fr"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#722F37]/5 hover:bg-[#722F37]/10 transition-colors"
            >
              <div className="w-10 h-10 bg-[#722F37] rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Par email
                </p>
                <p className="text-sm text-[#722F37]">
                  support@maison-colin-seguin.fr
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Bottom spacer */}
      <div className="h-2" />
    </div>
  );
}
