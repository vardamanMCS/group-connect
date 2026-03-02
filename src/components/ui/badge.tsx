import { ReactNode } from 'react';

interface BadgeProps {
  status: string;
  className?: string;
  children?: ReactNode;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  'a-faire': {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'A faire',
  },
  'en-cours': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    label: 'En cours',
  },
  'envoye': {
    bg: 'bg-blue-50',
    text: 'text-[#1B4965]',
    label: 'Envoy\u00e9',
  },
  'commande': {
    bg: 'bg-[#2D6A4F]/10',
    text: 'text-[#2D6A4F]',
    label: 'Command\u00e9',
  },
  'livre': {
    bg: 'bg-green-50',
    text: 'text-green-700',
    label: 'Livr\u00e9',
  },
  'annule': {
    bg: 'bg-red-50',
    text: 'text-[#722F37]',
    label: 'Annul\u00e9',
  },
  'brouillon': {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    label: 'Brouillon',
  },
  'active': {
    bg: 'bg-[#2D6A4F]/10',
    text: 'text-[#2D6A4F]',
    label: 'Active',
  },
  'terminee': {
    bg: 'bg-[#1B4965]/10',
    text: 'text-[#1B4965]',
    label: 'Termin\u00e9e',
  },
  'en-attente': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    label: 'En attente',
  },
};

const defaultStyle = {
  bg: 'bg-gray-100',
  text: 'text-gray-600',
  label: '',
};

export default function Badge({ status, className = '', children }: BadgeProps) {
  const style = statusStyles[status] || defaultStyle;
  const displayText = children || style.label || status;

  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1 rounded-full
        text-sm font-medium
        ${style.bg} ${style.text}
        ${className}
      `.trim()}
    >
      {displayText}
    </span>
  );
}
