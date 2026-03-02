'use client';

import Link from 'next/link';
import { Wine } from 'lucide-react';
import CommissionGauge from './commission-gauge';

interface HeaderProps {
  showGauge?: boolean;
  currentAmount?: number;
  nextTierAmount?: number;
}

export default function Header({
  showGauge = false,
  currentAmount = 0,
  nextTierAmount = 250,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Logo et nom */}
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-[#1B4965] rounded-lg flex items-center justify-center flex-shrink-0">
            <Wine className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[#1B4965] truncate">
            Group Connect
          </span>
        </Link>

        {/* Jauge compacte (optionnelle) */}
        {showGauge && (
          <div className="ml-4 flex-1 max-w-[200px]">
            <CommissionGauge
              currentAmount={currentAmount}
              nextTierAmount={nextTierAmount}
              variant="compact"
            />
          </div>
        )}
      </div>
    </header>
  );
}
