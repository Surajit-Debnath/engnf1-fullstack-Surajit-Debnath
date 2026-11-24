import { formatLabel } from '../../types/ticket';

interface TicketBadgeProps {
  value: string;
  type: 'priority' | 'status' | 'category' | 'review';
}

const priorityStyles: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-orange-50 text-orange-700',
  URGENT: 'bg-red-50 text-red-700',
};

const statusStyles: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};

const categoryStyles: Record<string, string> = {
  BILLING: 'bg-violet-50 text-violet-700',
  BUG: 'bg-red-50 text-red-700',
  FEATURE_REQUEST: 'bg-cyan-50 text-cyan-700',
  LOGIN: 'bg-indigo-50 text-indigo-700',
  DELIVERY: 'bg-orange-50 text-orange-700',
};

const reviewStyles: Record<string, string> = {
  REVIEWED: 'bg-emerald-50 text-emerald-700',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700',
  HUMAN_OVERRIDE: 'bg-indigo-50 text-indigo-700',
};

const styles = {
  priority: priorityStyles,
  status: statusStyles,
  category: categoryStyles,
  review: reviewStyles,
};

export default function TicketBadge({ value, type }: TicketBadgeProps) {
  return (
    <span
      className={`
                inline-flex items-center whitespace-nowrap
                rounded-full px-3 py-1
                text-xs font-semibold
                ${styles[type][value] || 'bg-slate-100 text-slate-600'}
            `}
    >
      {formatLabel(value)}
    </span>
  );
}
