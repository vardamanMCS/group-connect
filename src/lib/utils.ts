/**
 * Utility functions for Group Connect
 */

/**
 * Format a number as French euros: "184,50 €"
 */
export function formatCurrency(amount: number): string {
  return (
    amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' \u20ac'
  );
}

/**
 * Format an ISO date string as French long date: "12 mars 2026"
 */
export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a French phone number: "06 12 34 56 78"
 * Accepts strings with or without spaces/dots/dashes, with or without +33 prefix.
 */
export function formatPhone(phone: string): string {
  // Strip everything except digits and leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Handle +33 or 0033 prefix
  let digits: string;
  if (cleaned.startsWith('+33')) {
    digits = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0033')) {
    digits = '0' + cleaned.slice(4);
  } else {
    digits = cleaned;
  }

  // Format as pairs: 06 12 34 56 78
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  // If the number doesn't match expected length, return as-is
  return phone;
}

/**
 * Merge Tailwind CSS class names, filtering out falsy values.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get initials from a full name: "Jean Dupont" -> "JD"
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}
