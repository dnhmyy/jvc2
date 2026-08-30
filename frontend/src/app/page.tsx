'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  History,
  ShieldAlert,
  Ticket,
  FileText,
  Activity,
  Plus,
} from 'lucide-react';
import api from '@/lib/axios';
import { readSessionCache, writeSessionCache } from '@/lib/session-cache';
import { Ticket as TicketType } from '@/types';

const DASHBOARD_CACHE_KEY = 'dashboard-overview-v3';
const DASHBOARD_CACHE_TTL = 30_000;

type DashboardStats = {
  totalAssets: number;
  usedAssets: number;
  brokenAssets: number;
  repairAssets: number;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  criticalTickets: number;
  totalLogs: number;
};

type TicketPrioritySummary = {
  critical: number;
  high: number;
  medium: number;
  low: number;
};

type DashboardOverviewResponse = {
  stats: DashboardStats;
  ticketPriority: TicketPrioritySummary;
  recentTickets: TicketType[];
  recentLogs: Array<{
    id: number;
    description: string;
    created_at: string;
  }>;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    usedAssets: 0,
    brokenAssets: 0,
    repairAssets: 0,
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    criticalTickets: 0,
    totalLogs: 0,
  });
  const [ticketPriority, setTicketPriority] = useState<TicketPrioritySummary>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [recentLogs, setRecentLogs] = useState<DashboardOverviewResponse['recentLogs']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedData = readSessionCache<DashboardOverviewResponse>(DASHBOARD_CACHE_KEY, DASHBOARD_CACHE_TTL);

    if (cachedData) {
      setStats(cachedData.stats);
      setTicketPriority(cachedData.ticketPriority);
      setRecentTickets(cachedData.recentTickets);
      setRecentLogs(cachedData.recentLogs);
      setLoading(false);
    }

    const fetchDashboardData = async () => {
      try {
        const { data } = await api.get<DashboardOverviewResponse>('/dashboard-overview');
        setStats(data.stats);
        setTicketPriority(data.ticketPriority);
        setRecentTickets(data.recentTickets);
        setRecentLogs(data.recentLogs);
        writeSessionCache(DASHBOARD_CACHE_KEY, data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboardData();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchDashboardData();
      }
    }, 120000);

    return () => window.clearInterval(interval);
  }, []);

  const ticketPrioritySegments = useMemo(() => {
    const priorities = [
      { key: 'critical', label: 'Critical', color: '#ef4444' },
      { key: 'high', label: 'High', color: '#f97316' },
      { key: 'medium', label: 'Medium', color: '#f59e0b' },
      { key: 'low', label: 'Low', color: '#10b981' },
    ] as const;

    const activeTickets = priorities.map((priority) => ({
      ...priority,
      value: ticketPriority[priority.key],
    }));
    const totalActive = activeTickets.reduce((sum, item) => sum + item.value, 0);
    if (totalActive === 0) return [];

    let cumulative = 0;
    return activeTickets.map((item) => {
      const percentage = (item.value / totalActive) * 100;
      const segment = { ...item, percentage, start: cumulative };
      cumulative += percentage;
      return segment;
    }).filter((item) => item.value > 0);
  }, [ticketPriority]);

  const donutStyle = useMemo(() => {
    if (!ticketPrioritySegments.length) return { background: '#f1f5f9' };
    const gradients = ticketPrioritySegments.map(s => `${s.color} ${s.start}% ${s.start + s.percentage}%`).join(', ');
    return { background: `conic-gradient(${gradients})` };
  }, [ticketPrioritySegments]);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-[32px] bg-white/60 shadow-sm border border-slate-100"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="h-[28rem] animate-pulse rounded-[40px] bg-white/60 border border-slate-100"></div>
          <div className="h-[28rem] animate-pulse rounded-[40px] bg-white/60 border border-slate-100"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Header Section - Clean & Readable */}
      <section className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time infrastructure & support performance monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-xs font-semibold text-slate-400">System Status</span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid - Bento Box Style with Clean Typography */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Top Stat Cards */}
        {[
          { label: 'Total Assets', value: stats.totalAssets, detail: `${stats.usedAssets} In Use`, icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Open Tickets', value: stats.openTickets + stats.inProgressTickets, detail: `${stats.criticalTickets} Critical`, icon: Ticket, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Knowledge', value: 124, detail: 'Articles', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Activity', value: stats.totalLogs, detail: 'Recent logs', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, detail, icon: Icon, color, bg }, i) => (
          <div key={i} className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <div className={`rounded-2xl p-3 ${bg} ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{detail}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
            </div>
          </div>
        ))}

        {/* Quick Actions - Balanced & Filling */}
        <section className="lg:col-span-2 rounded-[32px] border border-white/60 bg-white/70 p-7 shadow-sm backdrop-blur-md flex flex-col min-h-[220px]">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-2">Quick Commands</h2>
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'New Ticket', icon: Plus, color: 'bg-primary text-white', href: '/tickets?action=new' },
                { label: 'Add Asset', icon: Boxes, color: 'bg-slate-900 text-white', href: '/assets' },
                { label: 'Search Wiki', icon: FileText, color: 'bg-white text-slate-600 border border-slate-100', href: '/knowledge-base' },
                { label: 'System Log', icon: History, color: 'bg-white text-slate-600 border border-slate-100', href: '/logs' },
              ].map(({ label, icon: Icon, color, href }, i) => (
                <Link key={i} href={href} className={`flex flex-col items-center justify-center text-center gap-3 p-5 rounded-3xl transition-all hover:shadow-lg hover:-translate-y-1 active:scale-[0.97] ${color}`}>
                  <div className="flex items-center justify-center h-10 w-10">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-tight leading-none">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Ticket Distribution */}
        <section className="lg:col-span-2 rounded-[32px] border border-white/60 bg-white/70 p-7 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Ticket Priority</h2>
            <div className="flex gap-2">
               {['Done', 'Active'].map(s => <span key={s} className="text-[11px] font-bold px-4 py-1.5 bg-slate-100 rounded-full text-slate-500 uppercase tracking-widest">{s}</span>)}
            </div>
          </div>
          <div className="flex items-center gap-12">
            <div className="relative shrink-0">
              <div className="h-36 w-36 rounded-full border-[10px] border-slate-50 shadow-inner" style={donutStyle}>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-white m-5 shadow-sm">
                  <span className="text-4xl font-bold text-slate-900">{stats.openTickets + stats.inProgressTickets}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 w-full">
               {[
                 { label: 'Critical', color: 'bg-rose-500', val: stats.criticalTickets },
                 { label: 'In Progress', color: 'bg-orange-500', val: stats.inProgressTickets },
                 { label: 'Open', color: 'bg-amber-400', val: stats.openTickets },
                 { label: 'Total Tickets', color: 'bg-blue-500', val: stats.totalTickets },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                   <div className="flex items-center gap-3">
                     <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                     <span className="text-sm font-bold text-slate-500">{item.label}</span>
                   </div>
                   <span className="text-lg font-bold text-slate-800">{item.val}</span>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Unit Condition - More Balanced Layout */}
        <section className="lg:col-span-1 rounded-[32px] border border-white/60 bg-white/70 p-7 shadow-sm backdrop-blur-md flex flex-col justify-between">
          <h2 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Unit Health</h2>
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            {[
              { label: 'Available Units', val: stats.totalAssets - stats.usedAssets, color: 'bg-emerald-400', total: stats.totalAssets },
              { label: 'In Use', val: stats.usedAssets, color: 'bg-blue-400', total: stats.totalAssets },
              { label: 'Under Repair', val: stats.repairAssets, color: 'bg-amber-400', total: stats.totalAssets },
            ].map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                  <span>{item.label}</span>
                  <span className="text-slate-800">{item.val}</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.val / Math.max(item.total, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Support */}
        <section className="lg:col-span-2 rounded-[32px] border border-white/60 bg-white/70 p-7 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">Recent Tickets</h2>
            <Link href="/tickets" className="text-xs font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {recentTickets.length > 0 ? recentTickets.map((ticket, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-slate-100 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${ticket.priority === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{ticket.title}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-500 uppercase">{ticket.status}</span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <ShieldAlert className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No active tickets</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="lg:col-span-1 rounded-[32px] border border-white/60 bg-white/70 p-7 shadow-sm backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">Recent Logs</h2>
            <Link href="/logs" className="text-xs font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="flex-1 space-y-4">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/30" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">{log.description}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6">
                <Activity className="h-10 w-10 mb-3 opacity-10" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">System Listening...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
