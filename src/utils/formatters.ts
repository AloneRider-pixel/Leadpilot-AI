/**
 * Indian Real Estate formatting utilities
 * Handles Lakhs (L) and Crores (Cr) cleanly
 */

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  if (amount === 0) return '₹0';

  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatIndianNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function getTemperatureBadgeClass(temp?: string): string {
  switch (temp) {
    case 'HOT':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
    case 'WARM':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
    case 'COLD':
      return 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

export function getStatusBadgeClass(status?: string): string {
  switch (status) {
    case 'NEW':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'CONTACTED':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'QUALIFIED':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'INTERESTED':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'SITE_VISIT':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'NEGOTIATION':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'BOOKED':
    case 'WON':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'LOST':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}
