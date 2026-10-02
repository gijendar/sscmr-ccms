import {ComplaintStatus} from '@/types/complaint';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({status, size = 'md'}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-semibold text-white shadow-sm',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.bg,
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          size === 'sm' ? 'h-1 w-1' : 'h-1.5 w-1.5',
          config.dot,
        ].join(' ')}
      />
      {status === 'IN_PROGRESS' ? 'In Progress' : status}
    </span>
  );
}

const STATUS_CONFIG: Record<ComplaintStatus, {bg: string; dot: string}> = {
  PENDING: {bg: 'bg-amber-500', dot: 'bg-amber-200'},
  IN_PROGRESS: {bg: 'bg-blue-600', dot: 'bg-blue-300'},
  COMPLETED: {bg: 'bg-green-600', dot: 'bg-green-200'},
  REJECTED: {bg: 'bg-slate-400', dot: 'bg-slate-300'},
};
