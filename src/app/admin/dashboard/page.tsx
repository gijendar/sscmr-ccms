'use client';

import {useState, useEffect, useCallback} from 'react';
import Link from 'next/link';
import {AdminLayout} from '../components/AdminLayout';
import {getComplaintCounts} from '@/services/complaint';
import {errorMessage} from '@/lib/utils';
import {PrioritiesTab} from './PriorityQueueTab';
import {PendingTab} from './PendingTab';
import {InProgressTab} from './InProgressTab';
import {CompletedTab} from './CompletedTab';
import {RejectedTab} from './RejectedTab';
import {AllComplaintsTab} from './AllComplaintsTab';
import {AnalyticsTab} from './AnalyticsTab';
import {PriorityKeywordsTab} from './PriorityKeywordsTab';
import {CategoriesTab} from './CategoriesTab';

const TABS = [
  {key: 'all', label: 'All Complaints'},
  {key: 'priority', label: 'Priority Queue'},
  {key: 'pending', label: 'Pending'},
  {key: 'in-progress', label: 'In Progress'},
  {key: 'completed', label: 'Completed'},
  {key: 'rejected', label: 'Rejected'},
  {key: 'keywords', label: 'Priority Keywords'},
  {key: 'categories', label: 'Categories'},
  {key: 'analytics', label: 'Analytics'},
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0,
    critical: 0,
    high: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await getComplaintCounts());
      setError(null);
    } catch (e: unknown) {
      setError(errorMessage(e, 'Failed to load dashboard statistics'));
      setCounts({total: 0, pending: 0, in_progress: 0, completed: 0, rejected: 0, critical: 0, high: 0});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getComplaintCounts()
      .then((result) => {
        if (!active) return;
        setCounts(result);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(errorMessage(e, 'Failed to load dashboard statistics'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>Complaint Management Dashboard</h1>
            <p className="mt-1 text-sm" style={{color: 'rgba(255,255,255,0.65)'}}>Track, prioritize and resolve college complaints.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/raise"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20"
              style={{background: 'rgba(255,255,255,0.1)'}}
            >
              Student form
            </Link>
            <button
              onClick={() => {
                setLoading(true);
                loadCounts();
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20"
              style={{background: 'rgba(255,255,255,0.1)'}}
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 border-b border-white/15 pb-0" style={{borderBottomColor: 'rgba(255,255,255,0.15)'}}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'rounded-tl-lg rounded-tr-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                activeTab === tab.key
                  ? 'border-t border-l border-primary/30 bg-primary/10 text-white font-semibold'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({length: 7}).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-5 animate-pulse">
                <div className="h-4 w-24 bg-white/20 rounded" />
                <div className="mt-3 h-8 w-16 bg-white/20 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-8">
            <StatCard label="Total Complaints" value={counts.total} color="text-white" bg="rgba(255,255,255,0.1)" border="rgba(255,255,255,0.2)" />
            <StatCard label="Pending" value={counts.pending} color="text-amber-200" bg="rgba(245,158,11,0.2)" border="rgba(245,158,11,0.4)" />
            <StatCard label="In Progress" value={counts.in_progress} color="text-blue-200" bg="rgba(59,130,246,0.2)" border="rgba(59,130,246,0.4)" />
            <StatCard label="Completed" value={counts.completed} color="text-green-200" bg="rgba(22,163,74,0.2)" border="rgba(22,163,74,0.4)" />
            <StatCard label="Rejected" value={counts.rejected} color="text-slate-300" bg="rgba(148,163,184,0.2)" border="rgba(148,163,184,0.4)" />
            <StatCard label="Critical" value={counts.critical} color="text-red-200" bg="rgba(239,68,68,0.2)" border="rgba(239,68,68,0.4)" />
            <StatCard label="High Priority" value={counts.high} color="text-orange-200" bg="rgba(249,115,22,0.2)" border="rgba(249,115,22,0.4)" />
            <StatCard label="Active Queue" value={counts.pending + counts.in_progress} color="text-white" bg="rgba(99,102,241,0.2)" border="rgba(99,102,241,0.4)" />
          </div>
        )}

        <div>
          {activeTab === 'all' && <AllComplaintsTab />}
          {activeTab === 'priority' && <PrioritiesTab />}
          {activeTab === 'pending' && <PendingTab />}
          {activeTab === 'in-progress' && <InProgressTab />}
          {activeTab === 'completed' && <CompletedTab onRemoved={loadCounts} />}
          {activeTab === 'rejected' && <RejectedTab onRemoved={loadCounts} />}
          {activeTab === 'keywords' && <PriorityKeywordsTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  label,
  value,
  color,
  bg,
  border,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} p-5 text-center shadow-sm`} style={{background: bg, borderColor: border}}>
      <p className={`text-sm font-medium ${color}`}>{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>{value}</p>
    </div>
  );
}
