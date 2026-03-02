import { TrendingUp } from 'lucide-react';

interface CommissionGaugeProps {
  currentAmount: number;
  nextTierAmount: number;
  nextTierLabel?: string;
  variant?: 'compact' | 'full';
}

function formatEuros(amount: number): string {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' \u20ac';
}

export default function CommissionGauge({
  currentAmount,
  nextTierAmount,
  nextTierLabel,
  variant = 'full',
}: CommissionGaugeProps) {
  const progress = Math.min((currentAmount / nextTierAmount) * 100, 100);
  const remaining = Math.max(nextTierAmount - currentAmount, 0);
  const isComplete = currentAmount >= nextTierAmount;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-bold text-[#2D6A4F] whitespace-nowrap">
          {formatEuros(currentAmount)}
        </span>
        <div className="flex-1 min-w-[80px] h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2D6A4F] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatEuros(nextTierAmount)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      {/* En-t\u00eate avec montant */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Votre commission</p>
          <p className="text-3xl font-bold text-[#2D6A4F]">
            {formatEuros(currentAmount)}
          </p>
        </div>
        <div className="w-10 h-10 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#2D6A4F]" />
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2D6A4F] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Informations sur le palier */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-500">
          Prochain palier :{' '}
          <span className="font-semibold text-gray-700">
            {formatEuros(nextTierAmount)}
          </span>
          {nextTierLabel && (
            <span className="text-gray-400"> ({nextTierLabel})</span>
          )}
        </p>
      </div>

      {/* Message motivationnel */}
      {!isComplete ? (
        <p className="mt-2 text-sm font-semibold text-[#2D6A4F]">
          Plus que {formatEuros(remaining)} !
        </p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-[#2D6A4F]">
          Palier atteint ! F\u00e9licitations !
        </p>
      )}
    </div>
  );
}
