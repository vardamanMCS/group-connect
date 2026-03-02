'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Megaphone,
  MessageSquare,
  BarChart3,
  User,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { label: 'Accueil', href: '/dashboard', icon: Home },
  { label: 'Campagnes', href: '/campaigns', icon: Megaphone },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'R\u00e9sultats', href: '/results', icon: BarChart3 },
  { label: 'Compte', href: '/account', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full
                transition-colors duration-150
                ${
                  isActive
                    ? 'text-[#1B4965]'
                    : 'text-gray-400 hover:text-gray-600'
                }
              `.trim()}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`}
              />
              <span
                className={`mt-1 text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
