'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth';

interface Props {
  pageKey: string;
  children: React.ReactNode;
}

export default function PageGate({ pageKey, children }: Props) {
  const { hydrated } = useAuthStore();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-unlock for admin/admin_jvc if already verified in session? 
  // No, PageGate is designed to be temporary.

  useEffect(() => {
    if (unlocked) return;
    setPin('');
    setError('');
    
    const timer = window.setTimeout(() => inputRef.current?.focus(), 500);
    return () => window.clearTimeout(timer);
  }, [pageKey, unlocked]);

  if (!hydrated) return null;

  if (unlocked) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError('');

    try {
      await api.post(`/page-gates/${pageKey}/verify`, {
        pin,
      });

      setUnlocked(true);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Something went wrong while verifying the PIN.'
        : 'Something went wrong while verifying the PIN.';
      setError(message);
      setPin('');
      inputRef.current?.focus();
    } finally {
      setChecking(false);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/35 backdrop-blur-sm flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-slate-900/10"
      >
        <div className="border-b border-[#b9d5f5] bg-gradient-to-br from-[#1d4f97] via-[#1568bb] to-[#4f92da] px-8 py-9 text-white">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/80">
              Restricted Access
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Verify page access
            </h1>
            <p className="text-sm text-blue-50/90 leading-relaxed">
              Enter the access PIN to open this page. Once you leave, access will be locked again.
            </p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                Access PIN
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  required
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pr-12 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  placeholder="••••••••"
                  autoComplete="off"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPin(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Temporary Unlock
                </p>
                <p className="text-xs text-slate-600">
                  Access stays active only while you remain on this page.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={checking || !pin}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{checking ? 'Verifying...' : 'Unlock Page'}</span>
              {!checking && <ChevronRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
