'use client';

import {useState, useEffect} from 'react';
import {getComplaintById, updateComplaintStatus} from '@/services/complaint';
import {formatDateTime, errorMessage} from '@/lib/utils';
import {PriorityBadge} from '@/app/components/PriorityBadge';
import {StatusBadge} from '@/app/components/StatusBadge';
import {REJECTION_REASONS, Complaint, ComplaintStatus} from '@/types/complaint';

interface ComplaintDetailProps {
  complaintId: number;
  onClose: () => void;
  onChanged?: (complaint: Complaint) => void;
}

export function ComplaintDetail({complaintId, onClose, onChanged}: ComplaintDetailProps) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getComplaintById(complaintId)
      .then((result) => {
        if (!active) return;
        setComplaint(result);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(errorMessage(e, 'Failed to load complaint'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [complaintId]);

  const doAction = async (status: ComplaintStatus, reason?: string) => {
    setActionLoading(status);
    setError(null);
    try {
      const updated = await updateComplaintStatus(complaintId, {
        status,
        completed_by: status === 'COMPLETED' ? 'Admin' : undefined,
        rejected_by: status === 'REJECTED' ? 'Admin' : undefined,
        rejection_reason: status === 'REJECTED' ? reason : undefined,
      });
      setComplaint(updated);
      onChanged?.(updated);
      setRejectOpen(false);
      setRejectReason('');
      setCustomReason('');
    } catch (e: unknown) {
      setError(errorMessage(e, 'Action failed'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl glass p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <p className="mt-3 text-sm text-white/70">Loading complaint details…</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl glass p-8 text-center">
        <p className="text-sm text-white/70">Complaint not found.</p>
        <button onClick={onClose} className="mt-3 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20">
          Close
        </button>
      </div>
    );
  }

  const active = complaint.status === 'PENDING' || complaint.status === 'IN_PROGRESS';
  const finalReason = rejectReason === 'Other' ? customReason.trim() : rejectReason;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>Complaint Details</h2>
        <button
          onClick={onClose}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          style={{background: 'rgba(255,255,255,0.1)'}}
        >
          Back to list
        </button>
      </div>

      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl glass shadow-sm" style={{background: 'rgba(255,255,255,0.06)'}}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 px-5 py-3" style={{background: 'rgba(255,255,255,0.1)', borderBottomColor: 'rgba(255,255,255,0.2)'}}>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{color: 'rgba(255,255,255,0.6)'}}>Complaint Number</span>
            <p className="mt-0.5 font-mono font-semibold text-white">{complaint.complaint_number}</p>
          </div>
          <div className="flex items-center gap-3">
            <PriorityBadge level={complaint.priority_level} showScore />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Detail label="Student Name" value={complaint.student_name} />
            <Detail label="Roll Number" value={complaint.roll_number} mono />
            <Detail label="Department" value={complaint.department} />
            <Detail label="Class / Division" value={complaint.class_division} />
            <Detail label="Contact Number" value={complaint.contact_number} mono />
            <Detail label="Gmail ID" value={complaint.gmail_id} />
            <Detail label="Category" value={complaint.category} />
            <Detail label="PC Number" value={complaint.pc_number || '—'} />
          </div>

          <div className="mt-5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{color: 'rgba(255,255,255,0.6)'}}>Description</label>
            <p className="mt-1 whitespace-pre-wrap text-white/90">{complaint.description}</p>
          </div>

          <div className="mt-5 rounded-lg bg-white/10 p-3" style={{background: 'rgba(255,255,255,0.1)'}}>
            <span className="text-xs font-medium uppercase tracking-wider" style={{color: 'rgba(255,255,255,0.6)'}}>Detected Keywords</span>
            <div className="mt-2 flex flex-wrap gap-1">
              {complaint.detected_keywords?.length ? (
                complaint.detected_keywords.map((k, i) => (
                  <span key={i} className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white/80 shadow-sm">
                    {typeof k === 'string' ? k : k.keyword}
                  </span>
                ))
              ) : (
                <span className="text-sm text-white/60">None detected</span>
              )}
            </div>
          </div>

          {complaint.status === 'REJECTED' && (              <div className="mt-5 rounded-lg border border-red-200/50 p-3" style={{background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)'}}>
              <span className="text-xs font-medium uppercase tracking-wider" style={{color: 'rgba(252,165,165,0.8)'}}>Rejection Reason</span>
              <p className="mt-1 text-sm text-red-100">{complaint.rejection_reason || '—'}</p>
            </div>
          )}

          <div className="mt-5 rounded-lg bg-white/10 p-4" style={{background: 'rgba(255,255,255,0.1)'}}>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{color: 'rgba(255,255,255,0.6)'}}>Timeline</div>
            <dl className="grid gap-3 sm:grid-cols-3">
              <Time label="Created At" value={complaint.created_at} />
              <Time label="Updated At" value={complaint.updated_at} />
              {complaint.completed_at && <Time label="Completed At" value={complaint.completed_at} />}
              {complaint.rejected_at && <Time label="Rejected At" value={complaint.rejected_at} />}
            </dl>
          </div>              {active && (
            <div className="mt-6 flex flex-wrap gap-3 border-t" style={{borderTopColor: 'rgba(255,255,255,0.2)'}} pt-5>
              {complaint.status === 'PENDING' && (
                <ActionButton
                  onClick={() => doAction('IN_PROGRESS')}
                  loading={actionLoading === 'IN_PROGRESS'}
                  className="border-blue-300/60 text-blue-200 hover:bg-blue-500/20"
                >
                  Mark In Progress
                </ActionButton>
              )}
              <ActionButton
                onClick={() => doAction('COMPLETED')}
                loading={actionLoading === 'COMPLETED'}
                className="border-green-300/60 text-green-200 hover:bg-green-500/20"
              >
                Mark Completed
              </ActionButton>
              <ActionButton
                onClick={() => setRejectOpen(true)}
                loading={false}
                className="border-red-300/60 text-red-200 hover:bg-red-500/20"
              >
                Reject
              </ActionButton>
            </div>
          )}
        </div>
      </div>

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border p-5 shadow-lg" style={{background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)'}}>
            <h3 className="text-base font-semibold" style={{color: '#ffffff'}}>Reject Complaint</h3>
            <p className="mt-1 text-sm" style={{color: 'rgba(255,255,255,0.7)'}}>Are you sure you want to reject this complaint?</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}}>Rejection Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{background: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)'}}
                >
                  <option value="">Select reason</option>
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

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
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason('');
                  setCustomReason('');
                }}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium"
                style={{borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)'}}
              >
                Cancel
              </button>
              <button
                onClick={() => doAction('REJECTED', finalReason)}
                disabled={!finalReason || actionLoading === 'REJECTED'}
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

function Detail({label, value, mono}: {label: string; value: string; mono?: boolean}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider" style={{color: 'rgba(255,255,255,0.6)'}}>{label}</label>
      <p className={`mt-1 ${mono ? 'font-mono' : ''}`} style={{color: 'rgba(255,255,255,0.9)'}}>{value}</p>
    </div>
  );
}

function Time({label, value}: {label: string; value: string}) {
  return (
    <div>
      <dt className="text-xs" style={{color: 'rgba(255,255,255,0.6)'}}>{label}</dt>
      <dd className="mt-0.5 font-mono text-sm" style={{color: 'rgba(255,255,255,0.8)'}}>{formatDateTime(value)}</dd>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  loading,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 ${className}`}
      style={{background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)'}}
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
