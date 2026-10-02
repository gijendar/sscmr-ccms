import {PriorityLevel} from '@/lib/priority';

interface PriorityBadgeProps {
  level: PriorityLevel;
  size?: 'sm' | 'md';
  showScore?: boolean;
}

export function PriorityBadge({level, size = 'md', showScore = false}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[level];
  if (!config) return null;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-semibold shadow-sm',
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
      {level}
      {showScore ? <span className="opacity-70">({config.score})</span> : null}
    </span>
  );
}

const PRIORITY_CONFIG: Record<PriorityLevel, {bg: string; dot: string; score: number}> = {
  CRITICAL: {bg: 'bg-red-700 text-white', dot: 'bg-red-200', score: 4},
  HIGH: {bg: 'bg-orange-600 text-white', dot: 'bg-orange-200', score: 3},
  MEDIUM: {bg: 'bg-yellow-500 text-white', dot: 'bg-yellow-200', score: 2},
  LOW: {bg: 'bg-slate-500 text-white', dot: 'bg-slate-300', score: 1},
};
