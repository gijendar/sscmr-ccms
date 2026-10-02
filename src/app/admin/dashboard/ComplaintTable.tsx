'use client';

import {Complaint, ComplaintStatus} from '@/types/complaint';
import {PriorityBadge} from '@/app/components/PriorityBadge';
import {StatusBadge} from '@/app/components/StatusBadge';
import {formatDateTime} from '@/lib/utils';

interface ComplaintTableProps {
  complaints: Complaint[];
  onView: (complaint: Complaint) => void;
  onAction?: (complaint: Complaint, status: ComplaintStatus) => void;
  actionLoading?: string | null;
  emptyMessage?: string;
}

export function ComplaintTable({
  complaints,
  onView,
  onAction,
  actionLoading,
  emptyMessage = 'No complaints found.',
}: ComplaintTableProps) {
  if (complaints.length === 0) {
    return (
      <div className="rounded-xl glass p-8 text-center" style={{background: 'rgba(255,255,255,0.06)'}}>
        <svg className="mx-auto h-10 w-10" style={{color: 'rgba(255,255,255,0.6)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 8h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="mt-3 text-sm" style={{color: 'rgba(255,255,255,0.7)'}}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl glass shadow-sm" style={{background: 'rgba(255,255,255,0.06)'}}>
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] divide-y divide-white/15">
          <thead className="border-b" style={{borderBottomColor: 'rgba(255,255,255,0.2)'}}>
            <tr>
              {['Complaint No.', 'Student', 'Department', 'Class', 'Category', 'Priority', 'Status', 'Submitted'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{color: 'rgba(255,255,255,0.7)'}}>
                  {h}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{color: 'rgba(255,255,255,0.7)'}}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{borderColor: 'rgba(255,255,255,0.15)'}}>
            {complaints.map((complaint) => {
              const busy = actionLoading === complaint.complaint_number;
              const active = complaint.status === 'PENDING' || complaint.status === 'IN_PROGRESS';
              return (
                <tr key={complaint.id} className="group transition-colors hover:bg-white/10" style={{backgroundColor: 'transparent'}} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-white">{complaint.complaint_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{complaint.student_name}</span>
                      <span className="text-xs text-white/60">Roll {complaint.roll_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80">{complaint.department}</td>
                  <td className="px-4 py-3 text-sm text-white/80">{complaint.class_division}</td>
                  <td className="px-4 py-3 text-sm text-white/80">{complaint.category}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge level={complaint.priority_level} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={complaint.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-white/60">
                    {formatDateTime(complaint.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onView(complaint)}
                        className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        View
                      </button>
                      {onAction && complaint.status === 'PENDING' && (
                        <button
                          onClick={() => onAction(complaint, 'IN_PROGRESS')}
                          disabled={busy}
                          title="Mark In Progress"
                          className="rounded-lg border border-blue-300/60 bg-blue-500/20 px-2.5 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-blue-500 hover:text-white disabled:opacity-50"
                        >
                          Start
                        </button>
                      )}
                      {onAction && active && (
                        <button
                          onClick={() => onAction(complaint, 'COMPLETED')}
                          disabled={busy}
                          title="Mark Completed"
                          className="rounded-lg border border-green-300/60 bg-green-500/20 px-2.5 py-1.5 text-xs font-medium text-green-200 transition-colors hover:bg-green-500 hover:text-white disabled:opacity-50"
                        >
                          Complete
                        </button>
                      )}
                      {onAction && active && (
                        <button
                          onClick={() => onAction(complaint, 'REJECTED')}
                          disabled={busy}
                          title="Reject"
                          className="rounded-lg border border-red-300/60 bg-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
