'use client';

import {useState} from 'react';

interface ComplaintSearchProps {
  onSearch: (query: string) => void;
}

export function ComplaintSearch({onSearch}: ComplaintSearchProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md">        <div className="relative flex-1">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{color: 'rgba(255,255,255,0.4)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by complaint number, student name, ID or category…"
          className="w-full rounded-lg border border-white/20 py-2 pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          style={{background: 'rgba(255,255,255,0.05)', color: '#ffffff'}}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="ml-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        style={{background: 'rgba(255,255,255,0.1)'}}
      >
        Search
      </button>
    </form>
  );
}
