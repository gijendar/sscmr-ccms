'use client';

import Link from 'next/link';
import {RaiseComplaintForm} from './components/RaiseComplaintForm';

export default function RaisePage() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">            <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
            style={{color: 'rgba(255,255,255,0.8)'}}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
          <h1 className="mt-4 text-2xl font-bold glass-heading" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>Raise a Complaint</h1>
          <p className="mt-1 text-sm" style={{color: 'rgba(255,255,255,0.75)'}}>
            Report an issue inside the college. Your complaint is prioritized automatically and you will receive
            a complaint number to track it.
          </p>
        </div>

        <div className="rounded-2xl glass p-6 shadow-sm" style={{background: 'rgba(255,255,255,0.08)'}}>
          <RaiseComplaintForm />
        </div>
      </div>
    </div>
  );
}
