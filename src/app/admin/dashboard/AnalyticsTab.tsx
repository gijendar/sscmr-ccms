'use client';

import {useState, useEffect} from 'react';
import {getAnalytics, type AnalyticsResult} from '@/services/complaint';
import {formatResolveTime, errorMessage} from '@/lib/utils';

export function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics()
      .then((result) => {
        setAnalytics(result);
        setError(null);
      })
      .catch((e: unknown) => setError(errorMessage(e, 'Failed to load analytics')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>Analytics</h2>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsKpi label="Total Complaints" value={sum(Object.values(analytics.byStatus))} color="text-white" bg="rgba(255,255,255,0.1)" border="rgba(255,255,255,0.2)" />
        <AnalyticsKpi label="Completed" value={analytics.byStatus['COMPLETED'] || 0} color="text-green-200" bg="rgba(22,163,74,0.2)" border="rgba(22,163,74,0.4)" />
        <AnalyticsKpi label="Pending" value={analytics.byStatus['PENDING'] || 0} color="text-amber-200" bg="rgba(245,158,11,0.2)" border="rgba(245,158,11,0.4)" />
        <AnalyticsKpi label="Rejected" value={analytics.byStatus['REJECTED'] || 0} color="text-slate-300" bg="rgba(148,163,184,0.2)" border="rgba(148,163,184,0.4)" />
        <AnalyticsKpi label="In Progress" value={analytics.byStatus['IN_PROGRESS'] || 0} color="text-blue-200" bg="rgba(59,130,246,0.2)" border="rgba(59,130,246,0.4)" />
        <AnalyticsKpi label="Critical" value={analytics.byPriority['CRITICAL'] || 0} color="text-red-200" bg="rgba(239,68,68,0.2)" border="rgba(239,68,68,0.4)" />
        <AnalyticsKpi label="High Priority" value={analytics.byPriority['HIGH'] || 0} color="text-orange-200" bg="rgba(249,115,22,0.2)" border="rgba(249,115,22,0.4)" />
        <AnalyticsKpi label="Medium Priority" value={analytics.byPriority['MEDIUM'] || 0} color="text-yellow-200" bg="rgba(234,179,8,0.2)" border="rgba(234,179,8,0.4)" />
        <AnalyticsKpi label="Low Priority" value={analytics.byPriority['LOW'] || 0} color="text-slate-300" bg="rgba(148,163,184,0.2)" border="rgba(148,163,184,0.4)" />
        <AnalyticsKpi label="Average Resolution" value={analytics.averageResolutionMinutes !== null ? formatResolveTime(analytics.averageResolutionMinutes) : '—'} color="text-blue-200" bg="rgba(59,130,246,0.2)" border="rgba(59,130,246,0.4)" isText />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SimpleChart
          title="Complaints by Category"
          data={analytics.byCategory}
          formatLabel={(k) => k}
        />
        <SimpleChart
          title="Complaints by Priority"
          data={analytics.byPriority}
          formatLabel={(k) => k}
        />
        <SimpleChart
          title="Complaints by Status"
          data={analytics.byStatus}
          formatLabel={(k) => (k === 'IN_PROGRESS' ? 'In Progress' : k)}
        />
        <SimpleChart
          title="Complaints by Department"
          data={analytics.byDepartment}
          formatLabel={(k) => k}
          horizontal
        />
      </div>
    </div>
  );
}

function AnalyticsKpi({
  label,
  value,
  color,
  bg,
  border,
  isText,
}: {
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
  isText?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 text-center shadow-sm`} style={{background: bg, borderColor: border}}>
      <p className={`text-sm font-medium ${color}`}>{label}</p>
      <p className={`mt-2 font-bold ${isText ? 'text-2xl' : 'text-3xl'}`} style={{color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>{value}</p>
    </div>
  );
}

interface SimpleChartProps {
  title: string;
  data: Record<string, number>;
  formatLabel: (key: string) => string;
  horizontal?: boolean;
}

function SimpleChart({title, data, formatLabel, horizontal}: SimpleChartProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? Math.max(...entries.map(([, v]) => v)) : 1;

  return (
    <div className="rounded-xl border p-5 shadow-sm" style={{background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)'}}>
      <h3 className="text-sm font-semibold" style={{color: 'rgba(255,255,255,0.9)'}}>{title}</h3>
      <div className={horizontal ? 'flex flex-col gap-2' : 'mt-4 space-y-3'}>
        {entries.map(([key, value]) => {
          const pct = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={key} className="flex items-center gap-3">
              {horizontal ? (
                <span className="min-w-[120px] text-xs" style={{color: 'rgba(255,255,255,0.6)'}}>{formatLabel(key)}</span>
              ) : (
                <span className="min-w-[110px] text-xs" style={{color: 'rgba(255,255,255,0.65)'}}>{formatLabel(key)}</span>
              )}
              <div className="flex-1">
                <div className="h-3 overflow-hidden rounded-full" style={{width: horizontal ? undefined : '100%', background: 'rgba(255,255,255,0.15)'}}>
                  <div
                    className="h-full rounded-full bg-primary/90"
                    style={{
                      width: horizontal ? `${pct}%` : undefined,
                      height: horizontal ? '100%' : `${pct}%`,
                      minWidth: horizontal ? '4px' : undefined,
                    }}
                  />
                </div>
              </div>
              <span className="min-w-[40px] text-right text-xs font-medium" style={{color: 'rgba(255,255,255,0.7)'}}>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
