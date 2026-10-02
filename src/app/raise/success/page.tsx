'use client';

import {useSearchParams} from 'next/navigation';
import {Suspense} from 'react';
import {ComplaintSuccess} from '../components/ComplaintSuccess';

function SuccessContent() {
  // Values come straight from the query string, so no effect is required.
  const searchParams = useSearchParams();
  const complaintNumber = searchParams.get('complaint_number') ?? '';
  const status = searchParams.get('status') ?? '';
  const description = searchParams.get('description') ?? '';

  if (!complaintNumber) {
    return (
      <div className="mx-auto max-w-lg rounded-xl glass p-8 text-center">
        <p className="text-sm text-white/80">
          No complaint reference was provided. Please raise a complaint to receive a complaint number.
        </p>
      </div>
    );
  }

  return (
    <ComplaintSuccess complaintNumber={complaintNumber} status={status} description={description} />
  );
}

export const dynamic = 'force-dynamic';

export default function RaiseSuccessPage() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <svg className="h-8 w-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-white/70">Loading…</p>
              </div>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
