'use client';

import Link from 'next/link';
import {useCopyToClipboard} from '@/hooks/use-copy-to-clipboard';
import {StatusBadge} from '@/app/components/StatusBadge';
import type {ComplaintStatus} from '@/types/complaint';

const STATUSES: ComplaintStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

interface SuccessProps {
  complaintNumber: string;
  status: string;
  description?: string;
  onDone?: () => void;
}

export function ComplaintSuccess({complaintNumber, status, description, onDone}: SuccessProps) {
  const {copy, copied} = useCopyToClipboard();
  const safeStatus: ComplaintStatus = STATUSES.includes(status as ComplaintStatus)
    ? (status as ComplaintStatus)
    : 'PENDING';

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/25 text-green-200">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold glass-heading">Complaint Registered Successfully</h1>
      <p className="mt-2 text-white/80">
        Please save your complaint number for future reference.
      </p>

      <div className="mt-8 rounded-xl glass p-6 shadow-sm">
        <div className="text-left">
          <span className="text-xs font-medium uppercase tracking-wider text-white/60">Complaint Number</span>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-lg font-semibold text-white">{complaintNumber}</p>
            <button
              onClick={() => copy(complaintNumber)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                copied
                  ? 'border-green-300/60 bg-green-500/20 text-green-200'
                  : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
              }`}
              aria-label="Copy complaint number"
            >
              <svg className="h-3.5 w-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Copy Complaint Number'}
            </button>
          </div>
        </div>

        <div className="mt-5 text-left">
          <span className="text-xs font-medium uppercase tracking-wider text-white/60">Status</span>
          <div className="mt-1">
            <StatusBadge status={safeStatus} />
          </div>
        </div>

        {description && (
          <div className="mt-4 rounded-lg bg-white/10 p-3 text-left text-sm text-white/80">
            <span className="font-medium text-white/60">Issue:</span> {description}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to Home
        </Link>
        <button
          onClick={onDone ?? (() => window.history.back())}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white/80 shadow-sm transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Raise another complaint
        </button>
      </div>
    </div>
  );
}
