'use client';

import {useState} from 'react';
import Link from 'next/link';

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative overflow-hidden">        <header className="sticky top-0 z-40 glass-nav" style={{background: 'rgba(255,255,255,0.08)'}}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">SSCMR</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="#raise" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Raise Complaint
            </Link>
            <Link href="#admin" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Admin Portal
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 glass px-6 py-4">
            <Link href="#raise" className="block py-2 text-sm font-medium text-white/80 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Raise Complaint
            </Link>
            <Link href="#admin" className="block py-2 text-sm font-medium text-white/80 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Admin Portal
            </Link>
          </div>
        )}
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Stronger hero glass so the headline stays readable over the background image. */}
          <div className="absolute inset-0" style={{background: 'rgba(15,23,42,0.25)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'}} />

          <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
            <div className="text-center">
              <span className="inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 shadow-sm backdrop-blur">
                Report • Prioritize • Resolve
              </span>
              <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight glass-heading md:text-5xl lg:text-6xl">
                College Complaint Management System
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
                Students report college issues, the system prioritizes them automatically, and administrators resolve them — powered by a smart priority queue.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Link
                  href="#raise"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{background: 'rgba(30,58,138,0.85)'}}
                >
                  Raise Complaint
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="#admin"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-6 py-3 text-sm font-semibold text-white/90 shadow-sm transition-all hover:bg-white/25 hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{background: 'rgba(255,255,255,0.12)'}}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Admin Portal
                </Link>
              </div>
            </div>

            {/* Feature grid */}
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
                title="Raise a Complaint"
                description="Submit a complaint in under a minute. Your complaint number is generated instantly."
                href="#raise"
              />
              <FeatureCard
                icon={
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Auto Priority"
                description="Every complaint is analyzed for keywords and automatically assigned a priority level."
                href="#priority"
              />
              <FeatureCard
                icon={
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 01-2-2h-2a2 2 0 01-2 2" />
                  </svg>
                }
                title="Admin Dashboard"
                description="Track, filter and manage complaints. Priority queue keeps the most urgent items on top."
                href="#admin"
              />
            </div>
          </div>
        </section>

        {/* Priority note */}
        <section id="priority" className="border-y border-white/15">
          <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full" style={{background: 'rgba(245,158,11,0.2)', color: 'rgba(251,191,36,0.9)'}}>
                PRIORITY QUEUE
              </span>
              <h2 className="text-2xl font-bold" style={{color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Smart Priority Queue</h2>
              <p className="max-w-xl" style={{color: 'rgba(255,255,255,0.7)'}}>
                Complaints are ordered by{' '}
                <code className="rounded" style={{background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)'}}>
                  priority_score DESC, created_at ASC
                </code>
                . Critical issues always appear first, and older complaints come before newer ones when priority is equal.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <PriorityBadge level="CRITICAL" score={4} />
                <PriorityBadge level="HIGH" score={3} />
                <PriorityBadge level="MEDIUM" score={2} />
                <PriorityBadge level="LOW" score={1} />
              </div>
            </div>
          </div>
        </section>

        {/* Raises & Admin CTA */}
        <section id="raise" className="border-b border-white/15 py-16">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold" style={{color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Ready to report an issue?</h2>
            <p className="mx-auto mt-3 max-w-xl" style={{color: 'rgba(255,255,255,0.7)'}}>
              Click below to open the complaint form. It takes less than a minute.
            </p>
            <div className="mt-8">
              <Link
                href="/raise"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{background: 'rgba(30,58,138,0.85)'}}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Start a Complaint
              </Link>
            </div>
          </div>
        </section>

        <section id="admin" className="border-t border-white/15 py-16">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold" style={{color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Admin Portal</h2>
            <p className="mx-auto mt-3 max-w-xl" style={{color: 'rgba(255,255,255,0.7)'}}>
              Sign in to view the priority queue, update statuses, and review analytics.
            </p>
            <div className="mt-8">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-8 py-3.5 text-base font-semibold text-white/90 shadow-sm transition-all hover:bg-white/25 hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Open Admin Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/20 glass px-6 py-8 text-center text-sm text-white/60" style={{background: 'rgba(15,23,42,0.2)'}}>
        College Complaint Management System — Report • Prioritize • Resolve
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (              <Link
                href={href}
                className="group flex items-start gap-4 rounded-xl glass p-5 text-left shadow-sm transition-all hover:border-white/35 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{background: 'rgba(255,255,255,0.08)'}}
              >
                <div className="mt-0.5 shrink-0 text-white">{icon}</div>
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-white transition-colors">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{description}</p>
                </div>
              </Link>
  );
}

function PriorityBadge({level, score}: {level: string; score: number}) {
  const colorMap: Record<string, {bg: string; text: string}> = {
    CRITICAL: {bg: 'rgba(239,68,68,0.2)', text: 'rgba(252,165,165,0.9)'},
    HIGH: {bg: 'rgba(249,115,22,0.2)', text: 'rgba(252,165,165,0.9)'},
    MEDIUM: {bg: 'rgba(234,179,8,0.2)', text: 'rgba(252,211,77,0.9)'},
    LOW: {bg: 'rgba(148,163,184,0.2)', text: 'rgba(148,163,184,0.8)'},
  };
  const colors = colorMap[level] ?? colorMap.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm`}
      style={{background: colors.bg, color: colors.text}}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{background: colors.text}} />
      {level} · {score}
    </span>
  );
}
