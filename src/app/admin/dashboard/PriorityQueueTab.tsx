'use client';

import {useState, useEffect} from 'react';
import {supabase} from '@/lib/supabase';
import {getComplaints, updateComplaintStatus} from '@/services/complaint';
import {Complaint, ComplaintStatus, REJECTION_REASONS} from '@/types/complaint';
import {PriorityBadge} from '@/app/components/PriorityBadge';
import {formatDateTime, errorMessage} from '@/lib/utils';

/**
 * PRIORITY QUEUE
 *
 * The queue contains only active complaints (PENDING, IN_PROGRESS) and is
 * ordered by the database query:
 *
 *   ORDER BY priority_score DESC, created_at ASC
 *
 * CRITICAL (4) first, then HIGH (3), MEDIUM (2), LOW (1). Within the same
 * priority band, the oldest complaint comes first.
 */
const ACTIVE_STATUSES: ComplaintStatus[] = ['PENDING', 'IN_PROGRESS'];

function queueSort(a: Complaint, b: Complaint) {
  if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

export function PrioritiesTab() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Complaint | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    let active = true;
    getComplaints({statuses: ACTIVE_STATUSES, limit: 200})
      .then((data) => {
        if (!active) return;
        setComplaints(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(errorMessage(e, 'Failed to load priority queue'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Realtime: new complaints and status/priority changes update the queue
  // without a manual refresh.
  useEffect(() => {
    const channel = supabase
      .channel('priority-queue')
      .on('postgres_changes', {event: '*', schema: 'public', table: 'complaints'}, (payload) => {
        setComplaints((prev) => {
          const record = (payload.eventType === 'DELETE' ? payload.old : payload.new) as Complaint;
          if (!record) return prev;

          const next = prev.filter((c) => c.id !== record.id);
          if (payload.eventType !== 'DELETE' && ACTIVE_STATUSES.includes(record.status)) {
            next.push(record);
          }
          return next.sort(queueSort);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const applyStatus = async (
    complaint: Complaint,
    status: ComplaintStatus,
    reason?: string,
  ) => {
    setActionLoading(complaint.complaint_number);
    setError(null);
    try {
      await updateComplaintStatus(complaint.id, {
        status,
        completed_by: status === 'COMPLETED' ? 'Admin' : undefined,
        rejected_by: status === 'REJECTED' ? 'Admin' : undefined,
        rejection_reason: status === 'REJECTED' ? reason : undefined,
      });
      // Completed/rejected complaints leave the active queue.
      setComplaints((prev) => prev.filter((c) => c.id !== complaint.id));
      setRejectTarget(null);
      setRejectReason('');
      setCustomReason('');
    } catch (e: unknown) {
      setError(errorMessage(e, 'Action failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const finalReason = rejectReason === 'Other' ? customReason.trim() : rejectReason;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({length: 6}).map((_, i) => (            <div key={i} className="h-20 animate-pulse rounded-xl border border-white/20 bg-white/10" />

        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  const levelOrder: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const groups = complaints.reduce<Record<string, Complaint[]>>((acc, c) => {
    (acc[c.priority_level] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-xl glass p-5 shadow-sm" style={{background: 'rgba(255,255,255,0.06)'}}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>Priority Queue</h2>
          <span className="rounded-full px-3 py-1 text-xs font-medium text-white/80 shadow-sm" style={{background: 'rgba(255,255,255,0.1)'}}>
            {complaints.length} active
          </span>
        </div>
        <p className="mt-1 text-sm" style={{color: 'rgba(255,255,255,0.6)'}}>
          Ordered by priority score (descending) then submission time (ascending). Completed and rejected
          complaints are removed from the queue.
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="rounded-xl glass p-8 text-center" style={{background: 'rgba(255,255,255,0.06)'}}>
          <svg className="mx-auto h-10 w-10" style={{color: 'rgba(255,255,255,0.5)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <p className="mt-3 text-sm" style={{color: 'rgba(255,255,255,0.7)'}}>Priority queue is empty. No active complaints.</p>
        </div>
      ) : (
        levelOrder.map((level) => {
          const items = groups[level];
          if (!items?.length) return null;
          return (
            <section key={level}>
              <div className="mb-2 flex items-center gap-2">
                <PriorityBadge level={level} size="sm" />
                <span className="rounded-full px-2 py-0.5 text-xs" style={{background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)'}}>{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((complaint, idx) => (
                  <QueueRow
                    key={complaint.id}
                    index={complaint.priority_score === 4 ? idx + 1 : undefined}
                    complaint={complaint}
                    loading={actionLoading === complaint.complaint_number}
                    onStart={() => applyStatus(complaint, 'IN_PROGRESS')}
                    onComplete={() => applyStatus(complaint, 'COMPLETED')}
                    onReject={() => {
                      setRejectTarget(complaint);
                      setRejectReason('');
                      setCustomReason('');
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border p-5 shadow-lg" style={{background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)'}}>
            <h3 className="text-base font-semibold text-slate-900">Reject Complaint</h3>
            <p className="mt-1 text-sm text-slate-600">
              Are you sure you want to reject {rejectTarget.complaint_number}?
            </p>

            <div className="mt-4 space-y-3">                <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                style={{background: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)'}}
              >
                <option value="">Select reason</option>
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {rejectReason === 'Other' && (
                <input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter rejection reason"
                  className="w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{background: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)'}}
                />
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium"
                style={{borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)'}}
              >
                Cancel
              </button>
              <button
                onClick={() => applyStatus(rejectTarget, 'REJECTED', finalReason)}
                disabled={!finalReason || actionLoading === rejectTarget.complaint_number}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                style={{background: 'rgba(239,68,68,0.85)'}}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueRow({
  complaint,
  index,
  loading,
  onStart,
  onComplete,
  onReject,
}: {
  complaint: Complaint;
  index?: number;
  loading: boolean;
  onStart: () => void;
  onComplete: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl glass p-4 shadow-sm sm:flex-row sm:items-start"
    style={{background: 'rgba(255,255,255,0.06)'}}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
      {index !== undefined && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-300/60 bg-red-500/25 text-sm font-bold text-red-200">
          {index}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-white">{complaint.complaint_number}</span>
          <PriorityBadge level={complaint.priority_level} size="sm" showScore />
          <span className="text-xs text-white/60">{complaint.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-white/90">{complaint.description}</p>
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-white/70">
          <span>{complaint.student_name}</span>
          <span>·</span>
          <span>{complaint.category}</span>
          <span>·</span>
          <span>{complaint.department}</span>
          <span>·</span>
          <span>{formatDateTime(complaint.created_at)}</span>
        </div>
        {complaint.detected_keywords?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {complaint.detected_keywords.map((k, i) => (
              <span key={i} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                {typeof k === 'string' ? k : k.keyword}
              </span>
            ))}
          </div>
        )}
      </div>          <div className="flex shrink-0 flex-wrap gap-2">
        {complaint.status === 'PENDING' && (
          <button
            onClick={onStart}
            disabled={loading}
            className="rounded-lg border border-blue-300/60 bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-200 shadow-sm transition-colors hover:bg-blue-500 hover:text-white disabled:opacity-50"
          >
            In Progress
          </button>
        )}
        <button
          onClick={onComplete}
          disabled={loading}
          className="rounded-lg border border-green-300/60 bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-200 shadow-sm transition-colors hover:bg-green-500 hover:text-white disabled:opacity-50"
        >
          Completed
        </button>
        <button
          onClick={onReject}
          disabled={loading}
          className="rounded-lg border border-red-300/60 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 shadow-sm transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
        >
          Reject
        </button>
      </div>

    </div>
  );
}
