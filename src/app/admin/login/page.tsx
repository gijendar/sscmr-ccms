'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const {data, error: authError} = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError || !data.user) {
        setError('Invalid email or password.');
        return;
      }

      // A signed-in user is not automatically an admin. Authorization is
      // enforced by the admin_profiles table + RLS policies.
      const {data: profile} = await supabase
        .from('admin_profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        setError('This account is not authorized as an administrator.');
        return;
      }

      router.push('/admin');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (      <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/90 text-white shadow-sm" style={{background: 'rgba(30,58,138,0.85)'}}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.2)'}}>Admin Portal</h1>
          <p className="mt-1" style={{color: 'rgba(255,255,255,0.7)'}}>Sign in to manage complaints</p>
        </div>

        <div className="rounded-2xl glass p-6 shadow-sm" style={{background: 'rgba(255,255,255,0.08)'}}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-white placeholder-white/50"
                placeholder="admin@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{color: '#ffffff'}}
              />
            </div>

            <div>
              <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-white placeholder-white/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{color: '#ffffff'}}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                loading ? 'cursor-not-allowed bg-slate-400' : 'hover:bg-primary-dark hover:shadow-md'
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-white/50">
            Use a Supabase-authenticated admin account to sign in.
          </div>
        </div>
      </div>
    </div>
  );
}
