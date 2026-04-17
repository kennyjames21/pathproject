import { format, parseISO, isToday, formatDistanceToNow } from 'date-fns';

export function formatTime(isoString) {
  if (!isoString) return '—';
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return isoString;
  }
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = parseISO(isoString);
    return isToday(d) ? 'Today' : format(d, 'MMM d, yyyy');
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    return format(parseISO(isoString), 'MMM d, h:mm a');
  } catch {
    return isoString;
  }
}

export function timeAgo(isoString) {
  if (!isoString) return '—';
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return isoString;
  }
}

export function getSupplyColor(remaining) {
  if (remaining <= 3) return 'text-red-600';
  if (remaining <= 7) return 'text-orange-500';
  return 'text-green-600';
}

export function getSupplyBg(remaining) {
  if (remaining <= 3) return 'bg-red-50 border-red-200';
  if (remaining <= 7) return 'bg-orange-50 border-orange-200';
  return 'bg-green-50 border-green-200';
}

export function getSeverityBadge(severity) {
  const classes = {
    major: 'badge-major',
    moderate: 'badge-moderate',
    minor: 'badge-minor',
  };
  return classes[severity?.toLowerCase()] || 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-base';
}

export const MED_COLORS = [
  '#4F86C6', '#E8735A', '#5CB85C', '#9B59B6',
  '#F39C12', '#1ABC9C', '#E74C3C', '#3498DB',
];
