import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CommissionGauge from '@/components/commission-gauge';
import Badge from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  TrendingUp,
  Euro,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Trophy,
  ChevronRight,
  Megaphone,
  Star,
  Target,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helper: commission status -> badge mapping
// ---------------------------------------------------------------------------

function getCommissionStatusBadge(status: string): {
  badgeStatus: string;
  label: string;
} {
  switch (status) {
    case 'estimated':
      return { badgeStatus: 'en-attente', label: 'Estimee' };
    case 'validated':
      return { badgeStatus: 'envoye', label: 'Validee' };
    case 'paid':
      return { badgeStatus: 'commande', label: 'Versee' };
    default:
      return { badgeStatus: 'a-faire', label: status };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CommissionsPage() {
  const supabase = await createClient();

  // --- Auth -----------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // --- Fetch all commissions ------------------------------------------------
  const { data: commissions } = await supabase
    .from('commissions')
    .select(`
      *,
      campaigns (
        id,
        name,
        offers (
          name,
          color
        )
      ),
      orders (
        id,
        amount,
        customer_name
      )
    `)
    .eq('commissioner_id', user.id)
    .order('estimated_at', { ascending: false });

  const allCommissions = commissions ?? [];

  // --- Compute totals by status ---------------------------------------------
  const estimatedTotal = allCommissions
    .filter((c) => c.status === 'estimated')
    .reduce((sum, c) => sum + c.amount, 0);

  const validatedTotal = allCommissions
    .filter((c) => c.status === 'validated')
    .reduce((sum, c) => sum + c.amount, 0);

  const paidTotal = allCommissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCommission = allCommissions.reduce(
    (sum, c) => sum + c.amount,
    0,
  );

  // --- Fetch all commission tiers -------------------------------------------
  const { data: tiers } = await supabase
    .from('commission_tiers')
    .select('*')
    .order('amount_threshold', { ascending: true });

  const allTiers = tiers ?? [];

  // --- Determine current and next tier --------------------------------------
  const reachedTiers = allTiers.filter(
    (t) => totalCommission >= t.amount_threshold,
  );
  const nextTier = allTiers.find(
    (t) => t.amount_threshold > totalCommission,
  );
  const currentTier = reachedTiers.length > 0
    ? reachedTiers[reachedTiers.length - 1]
    : null;

  const nextTierAmount = nextTier?.amount_threshold ?? totalCommission;
  const nextTierLabel = nextTier?.label ?? undefined;

  const isEmpty = allCommissions.length === 0;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#2D6A4F]/10 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#2D6A4F]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes commissions</h1>
          <p className="text-sm text-gray-500">
            {isEmpty
              ? 'Commencez a gagner des commissions'
              : 'Suivez vos gains en detail'}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Empty state                                                        */}
      {/* ------------------------------------------------------------------ */}
      {isEmpty && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#2D6A4F]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Euro className="w-8 h-8 text-[#2D6A4F]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Pas encore de commissions
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            Envoyez vos premieres campagnes pour commencer a gagner des commissions !
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

      {!isEmpty && (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* Commission Gauge (full / big)                                     */}
          {/* ---------------------------------------------------------------- */}
          <CommissionGauge
            currentAmount={totalCommission}
            nextTierAmount={nextTierAmount}
            nextTierLabel={nextTierLabel}
            variant="full"
          />

          {/* ---------------------------------------------------------------- */}
          {/* Three summary cards                                               */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-3 gap-3">
            {/* Estimees */}
            <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-orange-50">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(estimatedTotal)}
              </span>
              <span className="text-xs text-orange-600 font-medium mt-0.5">
                Estimees
              </span>
            </div>

            {/* Validees */}
            <div className="bg-white rounded-xl border border-[#1B4965]/30 shadow-sm p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#1B4965]/10">
                <CheckCircle2 className="w-5 h-5 text-[#1B4965]" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(validatedTotal)}
              </span>
              <span className="text-xs text-[#1B4965] font-medium mt-0.5">
                Validees
              </span>
            </div>

            {/* Versees */}
            <div className="bg-white rounded-xl border border-[#2D6A4F]/30 shadow-sm p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-[#2D6A4F]/10">
                <CircleDollarSign className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(paidTotal)}
              </span>
              <span className="text-xs text-[#2D6A4F] font-medium mt-0.5">
                Versees
              </span>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Commission Tiers                                                  */}
          {/* ---------------------------------------------------------------- */}
          {allTiers.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-[#2D6A4F]" />
                <h2 className="text-lg font-bold text-gray-900">
                  Paliers de commission
                </h2>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {allTiers.map((tier, index) => {
                  const isReached = totalCommission >= tier.amount_threshold;
                  const isCurrent = currentTier?.id === tier.id;
                  const isNext = nextTier?.id === tier.id;
                  const remaining = Math.max(
                    tier.amount_threshold - totalCommission,
                    0,
                  );

                  return (
                    <div
                      key={tier.id}
                      className={`
                        flex items-center gap-3 p-4
                        ${index < allTiers.length - 1 ? 'border-b border-gray-100' : ''}
                        ${isCurrent ? 'bg-[#2D6A4F]/5' : ''}
                        ${isNext ? 'bg-orange-50/50' : ''}
                      `.trim()}
                    >
                      {/* Check or target icon */}
                      <div className="flex-shrink-0">
                        {isReached ? (
                          <div className="w-8 h-8 bg-[#2D6A4F] rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        ) : isNext ? (
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Target className="w-5 h-5 text-orange-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Star className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Tier info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isReached
                                ? 'text-[#2D6A4F]'
                                : isCurrent
                                  ? 'text-[#2D6A4F]'
                                  : 'text-gray-700'
                            }`}
                          >
                            {tier.label}
                          </span>
                          {isCurrent && (
                            <span className="text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 rounded-full font-medium">
                              Actuel
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(tier.amount_threshold)}
                        </p>
                        {tier.message && isReached && (
                          <p className="text-xs text-[#2D6A4F] mt-0.5">
                            {tier.message}
                          </p>
                        )}
                      </div>

                      {/* Motivational message for next tier */}
                      {isNext && (
                        <span className="text-sm font-semibold text-orange-600 flex-shrink-0">
                          Plus que {formatCurrency(remaining)} !
                        </span>
                      )}

                      {/* Reached checkmark text */}
                      {isReached && (
                        <span className="text-xs font-medium text-[#2D6A4F] flex-shrink-0">
                          Atteint
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Commission History                                                */}
          {/* ---------------------------------------------------------------- */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Historique des commissions
            </h2>

            <div className="space-y-2">
              {allCommissions.map((commission) => {
                const { badgeStatus, label } = getCommissionStatusBadge(
                  commission.status,
                );
                const campaign = commission.campaigns as unknown as {
                  id: string;
                  name: string;
                  offers: { name: string; color: string | null } | null;
                } | null;
                const order = commission.orders as unknown as {
                  id: string;
                  amount: number;
                  customer_name: string;
                } | null;

                return (
                  <div
                    key={commission.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {campaign?.name ?? 'Campagne'}
                        </h3>
                        {order && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            Commande de {formatCurrency(order.amount)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(commission.estimated_at)}
                        </p>
                        <div className="mt-2">
                          <Badge status={badgeStatus}>{label}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-lg font-bold text-[#2D6A4F]">
                          +{formatCurrency(commission.amount)}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">
                          {Math.round(commission.rate * 100)} %
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
