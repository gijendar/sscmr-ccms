'use client';

import {useState, useEffect} from 'react';
import {getComplaints, updateComplaintStatus} from '@/services/complaint';
import type {ComplaintFilter} from '@/services/complaint';
import {errorMessage} from '@/lib/utils';
import {Complaint, ComplaintStatus} from '@/types/complaint';
import {ComplaintTable} from './ComplaintTable';
import {ComplaintFilters} from './ComplaintFilters';
import {ComplaintDetail} from './ComplaintDetail';

export function InProgressTab() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<ComplaintFilter>({});
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getComplaints({...filters, status: 'IN_PROGRESS', limit: 200})
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
  }, [filters]);

  const handleAction = async (complaint: Complaint, status: ComplaintStatus) => {
    if (status === 'REJECTED') {
      setDetailId(complaint.id);
      return;
    }
    setActionLoading(complaint.complaint_number);
    setError(null);
    try {
      await updateComplaintStatus(complaint.id, {
        status,
        completed_by: status === 'COMPLETED' ? 'Admin' : undefined,
      });
      setComplaints((prev) => prev.filter((c) => c.id !== complaint.id));
    } catch (e: unknown) {
      setError(errorMessage(e, 'Action failed'));
    } finally {
      setActionLoading(null);
    }
  };

  if (detailId !== null) {
    return (
      <div className="mx-auto max-w-3xl">
        <ComplaintDetail
          complaintId={detailId}
          onClose={() => setDetailId(null)}
          onChanged={(updated) => {
            if (updated.status !== 'IN_PROGRESS') {
              setComplaints((prev) => prev.filter((c) => c.id !== updated.id));
            }
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>In Progress</h2>
        <span className="rounded-full px-3 py-1 text-xs font-medium shadow-sm" style={{background: 'rgba(59,130,246,0.2)', color: 'rgba(96,165,250,0.9)'}}>
          {complaints.length} in progress
        </span>
      </div>

      <div className="mb-4">
        <ComplaintFilters
          onFilters={(f) => {
            setLoading(true);
            setFilters(f);
          }}
          showStatus={false}
        />
      </div>

      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-white/20 bg-white/10" />
          ))}
        </div>
      ) : (
        <ComplaintTable
          complaints={complaints}
          onView={(c) => setDetailId(c.id)}
          onAction={handleAction}
          actionLoading={actionLoading}
          emptyMessage="No complaints in progress."
        />
      )}
    </div>
  );
}
