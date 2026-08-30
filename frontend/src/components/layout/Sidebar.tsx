'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bot,
  Database,
  Ticket,
  BookOpenText,
  History,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { X } from 'lucide-react';
import logoApp from '@/app/icon.png';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', group: 'Workspace' },
  { icon: Ticket, label: 'Tickets', href: '/tickets', group: 'Workspace' },
  { icon: BookOpenText, label: 'Guides', href: '/knowledge-base', group: 'Workspace' },
  { icon: Database, label: 'Assets', href: '/assets', group: 'Infrastructure' },
  { icon: History, label: 'Audit Logs', href: '/logs', group: 'Security' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const menuGroups = ['Workspace', 'Infrastructure', 'Security'] as const;

  useEffect(() => {
    [...menuItems.map((item) => item.href), '/settings'].forEach((href) => {
      router.prefetch(href);
    });
  }, [router]);

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const SidebarContent = (
    <div className="flex h-full flex-col rounded-[32px] border border-[var(--border)] bg-white/94 p-4 shadow-[0_16px_40px_rgba(17,38,69,0.08)] backdrop-blur-xl">
      <div className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2">
            <Image
              src={logoApp}
              alt="IT Support System"
              className="h-full w-full object-contain"
              priority
              sizes="44px"
            />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-[var(--foreground)]">OpsCore</span>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[#7f90a6]">IT Support System</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#7f90a6] hover:bg-[var(--surface-soft)] lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="space-y-5 pr-1">
        {menuGroups.map((group) => (
          <div key={group} className="space-y-1.5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8a9bae]">
              {group}
            </p>
            {menuItems
              .filter((item) => item.group === group)
              .map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[var(--primary-soft)] text-primary'
                        : 'text-[#586d84] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-[#93a4b8]')} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      {/* System Architecture Widget - Moved up & Compact */}
      <div className="my-4 px-1">
        <div className="rounded-[28px] border border-slate-100 bg-slate-50/40 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-4">Architecture</p>
          
          <div className="space-y-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-800 leading-none mb-1">Gemini 2.0 Flash</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-y border-slate-100 py-3">
              <div className="space-y-0.5">
                <p className="text-[8px] font-bold text-slate-400 uppercase">DB Sync</p>
                <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime
                </span>
              </div>
              <div className="space-y-0.5 text-right border-l border-slate-100 pl-2">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Supa Ping</p>
                <p className="text-[9px] font-bold text-slate-700">12ms</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Jakarta (ID)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">Laravel • Next • Supa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <Link
          href="/settings"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[#586d84] transition-all hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
        >
          <Settings className="h-4 w-4 text-[#93a4b8]" />
          <span>Settings</span>
        </Link>

        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#eef5ff_0%,#d4e4fb_100%)] text-primary shadow-inner">
              <ProfileAvatar iconId={user?.profile_icon} name={user?.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user?.name || 'Guest User'}</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8496aa]">
                {user?.role || 'visitor'}
              </p>
            </div>
            <button
              onClick={handleLogoutClick}
              aria-label="Logout"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8496aa] transition-all hover:bg-rose-50 hover:text-rose-600"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Logout Confirmation Modal Overlay - Global Center */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-[6px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[320px] overflow-hidden rounded-[32px] border border-white/20 bg-white/80 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.2)] backdrop-blur-3xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-rose-50 text-rose-500 shadow-sm">
                  <LogOut className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-950">Sign Out</h3>
                <p className="mb-8 text-sm font-medium text-slate-500 leading-relaxed">
                  Are you sure you want to end your session and sign out from OpsCore system?
                </p>
                
                <div className="flex w-full flex-col gap-3">
                  <button
                    onClick={() => logout()}
                    className="w-full rounded-2xl bg-rose-500 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,63,94,0.3)] transition-all hover:bg-rose-600 hover:shadow-[0_10px_25px_rgba(244,63,94,0.4)] active:scale-[0.98]"
                  >
                    Yes, Sign Out
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[18rem] p-5 lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-[rgba(15,31,58,0.36)] backdrop-blur-sm lg:hidden"
          />
          <aside className="fixed left-0 top-0 z-[60] h-screen w-[20rem] p-4 lg:hidden">
            {SidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
