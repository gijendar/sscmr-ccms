'use client';

import {useState, useEffect} from 'react';
import {getComplaints, deleteComplaint} from '@/services/complaint';
import {Complaint} from '@/types/complaint';
import {PriorityBadge} from '@/app/components/PriorityBadge';
import {formatDateTime, errorMessage} from '@/lib/utils';
import {RemoveComplaintDialog} from './RemoveComplaintDialog';

export function RejectedTab({onRemoved}: {onRemoved?: () => void} = {}) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Complaint | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let active = true;
    getComplaints({status: 'REJECTED', limit: 200, sort: 'newest'})
      .then((data) => {
        if (!active) return;
        setComplaints(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(errorMessage(e, 'Failed to load complaints'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRemove = async () => {
    if (!pendingRemove) return;
    const target = pendingRemove;
    setRemoving(true);
    setError(null);
    setNotice(null);
    try {
      await deleteComplaint(target.id);
      // Only drop the row after the database confirms the delete succeeded.
      setComplaints((prev) => prev.filter((c) => c.id !== target.id));
      setPendingRemove(null);
      setNotice(`Complaint ${target.complaint_number} permanently removed.`);
      onRemoved?.();
    } catch (e: unknown) {
      // Leave the complaint in the list and surface the real failure.
      setError(errorMessage(e, 'Failed to remove complaint. Please try again.'));
      setPendingRemove(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>Rejected Complaints</h2>
        <span className="rounded-full px-3 py-1 text-xs font-medium shadow-sm" style={{background: 'rgba(148,163,184,0.2)', color: 'rgba(148,163,184,0.85)'}}>
          {complaints.length} rejected
        </span>
      </div>

      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      {loading ? (
        <div className="space-y-3">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-xl glass p-8 text-center">
          <svg className="mx-auto h-10 w-10 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="mt-3 text-sm text-white/70">No rejected complaints.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl glass shadow-sm" style={{background: 'rgba(255,255,255,0.06)'}}>
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] divide-y" style={{borderColor: 'rgba(255,255,255,0.15)'}}>
              <thead className="border-b" style={{borderBottomColor: 'rgba(255,255,255,0.2)'}}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Complaint No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Rejected At</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Submitted</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15">
                {complaints.map((complaint) => (
                  <tr key={complaint.id} className="group transition-colors hover:bg-white/10">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-white">{complaint.complaint_number}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80">
                      <div>
                        <span className="font-medium text-white">{complaint.student_name}</span>
                        <span className="block text-xs text-white/60">Roll {complaint.roll_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80">{complaint.category}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge level={complaint.priority_level} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80">
                      {complaint.rejected_at ? formatDateTime(complaint.rejected_at) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70">{complaint.rejection_reason || '—'}</td>
                    <td className="px-4 py-3 text-sm text-white/60">{formatDateTime(complaint.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setNotice(null);
                          setError(null);
                          setPendingRemove(complaint);
                        }}
                        className="rounded-lg border border-red-300/60 bg-red-500/20 px-2.5 py-1.5 text-xs font-semibold text-red-200 shadow-sm transition-colors hover:bg-red-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingRemove && (
        <RemoveComplaintDialog
          complaintNumber={pendingRemove.complaint_number}
          removing={removing}
          onCancel={() => setPendingRemove(null)}
          onConfirm={handleRemove}
        />
      )}
    </div>
  );
}
