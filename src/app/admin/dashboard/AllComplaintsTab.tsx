'use client';

import {useState, useEffect, useCallback, useMemo} from 'react';
import {supabase} from '@/lib/supabase';
import {getComplaintsPage, updateComplaintStatus} from '@/services/complaint';
import type {ComplaintFilter} from '@/services/complaint';
import {errorMessage, formatDateTime} from '@/lib/utils';
import {Complaint, ComplaintStatus} from '@/types/complaint';
import {toCsv, downloadCsv, csvFilename} from '@/lib/csv';
import {ComplaintTable} from './ComplaintTable';
import {ComplaintFilters} from './ComplaintFilters';
import {ComplaintSearch} from './ComplaintSearch';
import {ComplaintDetail} from './ComplaintDetail';

const PAGE_SIZES = [25, 50, 100] as const;
const EXPORT_CHUNK = 1000;
const EXPORT_MAX_PAGES = 50;

export function AllComplaintsTab() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ComplaintFilter>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Filters/search are shared by the paged view and the exporter so both
  // always describe the same result set.
  const activeFilter = useMemo<ComplaintFilter>(
    () => ({...filters, search: search || undefined}),
    [filters, search],
  );

  const load = useCallback(async () => {
    const result = await getComplaintsPage(activeFilter, page, pageSize);
    setComplaints(result.rows);
    setTotal(result.total);
  }, [activeFilter, page, pageSize]);

  useEffect(() => {
    let active = true;
    getComplaintsPage(activeFilter, page, pageSize)
      .then((result) => {
        if (!active) return;
        setComplaints(result.rows);
        setTotal(result.total);
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
  }, [activeFilter, page, pageSize]);

  // Live updates: new complaints and status changes appear without a manual
  // refresh, so the dashboard stays current while admins work.
  useEffect(() => {
    const channel = supabase
      .channel('all-complaints')
      .on('postgres_changes', {event: '*', schema: 'public', table: 'complaints'}, () => {
        load().catch(() => {
          /* the visible error state already reflects failed loads */
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const handleAction = async (complaint: Complaint, status: ComplaintStatus) => {
    if (status === 'REJECTED') {
      // Rejection needs a reason, so open the detail view instead.
      setDetailId(complaint.id);
      return;
    }
    setActionLoading(complaint.complaint_number);
    setError(null);
    try {
      const updated = await updateComplaintStatus(complaint.id, {
        status,
        completed_by: status === 'COMPLETED' ? 'Admin' : undefined,
      });
      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e: unknown) {
      setError(errorMessage(e, 'Action failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setNotice(null);
    try {
      // Walk the result set in chunks so exports are not capped by the
      // database's per-request row limit.
      const all: Complaint[] = [];
      let currentPage = 1;
      for (;;) {
        const {rows, total: counted} = await getComplaintsPage(
          activeFilter,
          currentPage,
          EXPORT_CHUNK,
        );
        all.push(...rows);
        const reachedEnd = rows.length < EXPORT_CHUNK || all.length >= counted;
        if (reachedEnd || currentPage >= EXPORT_MAX_PAGES) break;
        currentPage += 1;
      }

      const csv = toCsv([
        [
          'Complaint Number',
          'Student Name',
          'Roll Number',
          'Department',
          'Class / Division',
          'Contact Number',
          'Gmail ID',
          'Category',
          'PC Number',
          'Description',
          'Priority',
          'Priority Score',
          'Detected Keywords',
          'Status',
          'Rejection Reason',
          'Created At',
          'Updated At',
          'Completed At',
          'Rejected At',
        ],
        ...all.map((c) => [
          c.complaint_number,
          c.student_name,
          c.roll_number,
          c.department,
          c.class_division,
          c.contact_number,
          c.gmail_id,
          c.category,
          c.pc_number ?? '',
          c.description,
          c.priority_level,
          c.priority_score,
          (c.detected_keywords || [])
            .map((k) => (typeof k === 'string' ? k : k.keyword))
            .join('; '),
          c.status,
          c.rejection_reason ?? '',
          formatDateTime(c.created_at),
          formatDateTime(c.updated_at),
          c.completed_at ? formatDateTime(c.completed_at) : '',
          c.rejected_at ? formatDateTime(c.rejected_at) : '',
        ]),
      ]);

      downloadCsv(csvFilename('complaints'), csv);
      setNotice(`Exported ${all.length} complaint${all.length === 1 ? '' : 's'} to CSV.`);
    } catch (e: unknown) {
      setError(errorMessage(e, 'Export failed. Please try again.'));
    } finally {
      setExporting(false);
    }
  };

  if (detailId !== null) {
    return (
      <div className="mx-auto max-w-3xl">
        <ComplaintDetail
          complaintId={detailId}
          onClose={() => setDetailId(null)}
          onChanged={(updated) => {
            setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          }}
        />
      </div>
    );
  }

  const hasQuery = Boolean(search || Object.values(filters).some(Boolean));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ComplaintSearch
          onSearch={(value) => {
            setLoading(true);
            setPage(1);
            setSearch(value);
          }}
        />          <button
          onClick={handleExport}
          disabled={exporting || loading || total === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white/80 shadow-sm transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          style={{background: 'rgba(255,255,255,0.1)'}}
        >
          <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M4 6a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          </svg>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div className="mb-4">
        <ComplaintFilters
          onFilters={(f) => {
            setLoading(true);
            setPage(1);
            setFilters(f);
          }}
        />
      </div>

      {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      {loading ? (
        <div className="space-y-3">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-white/20 bg-white/10" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {total === 0
                ? hasQuery
                  ? 'No complaint found.'
                  : 'No complaints recorded yet.'
                : `Showing ${firstRow}–${lastRow} of ${total} complaint${total === 1 ? '' : 's'}${
                    hasQuery ? ' matching your search/filters' : ''
                  }`}
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-500">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => {
                  setLoading(true);
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ComplaintTable
            complaints={complaints}
            onView={(c) => setDetailId(c.id)}
            onAction={handleAction}
            actionLoading={actionLoading}
            emptyMessage={hasQuery ? 'No complaint found.' : 'No complaints recorded yet.'}
          />

          {total > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">                <span className="text-xs" style={{color: 'rgba(255,255,255,0.6)'}}>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setLoading(true);
                    setPage(1);
                  }}
                  disabled={page <= 1}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20 disabled:opacity-50"
                  style={{background: 'rgba(255,255,255,0.1)'}}
                >
                  First
                </button>
                <button
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={page <= 1}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20 disabled:opacity-50"
                  style={{background: 'rgba(255,255,255,0.1)'}}
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20 disabled:opacity-50"
                  style={{background: 'rgba(255,255,255,0.1)'}}
                >
                  Next
                </button>
                <button
                  onClick={() => {
                    setLoading(true);
                    setPage(totalPages);
                  }}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20 disabled:opacity-50"
                  style={{background: 'rgba(255,255,255,0.1)'}}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
