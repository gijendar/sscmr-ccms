'use client';

import {useEffect, useState} from 'react';
import {ComplaintStatus, PriorityLevel} from '@/types/complaint';
import {getCategories} from '@/services/categories';
import type {ComplaintFilter} from '@/services/complaint';

const PRIORITIES: PriorityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES: ComplaintStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

interface ComplaintFiltersProps {
  onFilters: (filters: ComplaintFilter) => void;
  showStatus?: boolean;
}

export function ComplaintFilters({onFilters, showStatus = true}: ComplaintFiltersProps) {
  const [priority, setPriority] = useState<PriorityLevel | ''>('');
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    getCategories()
      .then((rows) => setCategories(rows.map((r) => r.name)))
      .catch(() => setCategories([]));
  }, []);

  const build = (): ComplaintFilter => ({
    priority_level: priority || undefined,
    status: showStatus ? status || undefined : undefined,
    category: category || undefined,
    department: department || undefined,
    from_date: fromDate ? new Date(fromDate).toISOString() : undefined,
    to_date: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined,
  });

  const reset = () => {
    setPriority('');
    setStatus('');
    setCategory('');
    setDepartment('');
    setFromDate('');
    setToDate('');
    onFilters({});
  };

  const selectClass =
    'rounded-lg border border-white/20 px-3 py-1.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
  const selectStyle = {background: 'rgba(255,255,255,0.05)', color: '#ffffff'} as React.CSSProperties;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={selectClass} value={priority} onChange={(e) => setPriority(e.target.value as PriorityLevel | '')} style={selectStyle}>
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {showStatus && (
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatus | '')} style={selectStyle}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'IN_PROGRESS' ? 'In Progress' : s}
            </option>
          ))}
        </select>
      )}

      <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        className={selectClass}
        placeholder="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        style={selectStyle}
      />

      <input className={selectClass} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={selectStyle} />
      <input className={selectClass} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={selectStyle} />

      <button
        onClick={() => onFilters(build())}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={{background: 'rgba(30,58,138,0.85)'}}
      >
        Apply
      </button>

      <button
        onClick={reset}
        className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        style={{background: 'rgba(255,255,255,0.1)'}}
      >
        Clear
      </button>
    </div>
  );
}
