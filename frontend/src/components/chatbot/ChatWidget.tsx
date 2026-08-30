'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, 
  Bot, 
  Trash2, 
  X, 
  Sparkles,
  Wifi,
  BookOpen,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { readSessionCache, writeSessionCache } from '@/lib/session-cache';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const CHATBOT_HISTORY_CACHE_KEY = 'chatbot-history';
const CHATBOT_HISTORY_CACHE_TTL = 60_000;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      const cachedMessages = readSessionCache<Message[]>(CHATBOT_HISTORY_CACHE_KEY, CHATBOT_HISTORY_CACHE_TTL);
      if (cachedMessages) {
        setMessages(cachedMessages);
      }
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/chatbot/history');
      const backendMessages = res.data.messages;
      
      // Hanya update kalau layar lagi kosong atau cuma ada pesan awal
      // Biar nggak nimpa pesan yang lagi dikirim (race condition)
      setMessages(prev => {
        if (prev.length > 0 && !readSessionCache(CHATBOT_HISTORY_CACHE_KEY, CHATBOT_HISTORY_CACHE_TTL)) {
          return prev;
        }
        writeSessionCache(CHATBOT_HISTORY_CACHE_KEY, backendMessages);
        return backendMessages;
      });
    } catch {}
  };

  const clearHistory = async () => {
    try {
      setMessages([]);
      // Force remove item from session storage
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(CHATBOT_HISTORY_CACHE_KEY);
      }
      await api.delete('/chatbot/history');
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if (!text.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', { message: text });
      setMessages(prev => {
        const nextMessages: Message[] = [...prev, { role: 'assistant', content: res.data.reply }];
        writeSessionCache(CHATBOT_HISTORY_CACHE_KEY, nextMessages);
        return nextMessages;
      });
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error)
        ? error.response?.data?.reply || error.response?.data?.error || 'Gagal kirim pesan. Coba lagi ya.'
        : 'Gagal kirim pesan. Coba lagi ya.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const shortcuts = [
    { label: 'Access', icon: Wifi, text: 'Cek data akses (WiFi, ISP, CCTV, dll)...' },
    { label: 'Guide', icon: BookOpen, text: 'Cara benerin printer macet gimana ya?' },
    { label: 'Audit', icon: ShieldCheck, text: 'Siapa aja yang terakhir ubah password?' },
  ];

  const renderContent = (content: string, role: string) => {
    // Basic Markdown Parser: Handles **bold** and line breaks
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong 
            key={index} 
            className={cn(
              "font-extrabold", 
              role === 'user' ? "text-white" : "text-slate-900"
            )}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-10 right-10 z-[100]">
      {/* Draggable Container */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -250, bottom: 0 }}
        dragElastic={0.1}
        className="flex flex-col items-end gap-4 transition-all duration-300"
      >
        {/* Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="mb-2 flex h-[580px] w-[380px] flex-col overflow-hidden rounded-[32px] border border-[var(--border)] bg-white/94 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl"
              // Prevent drag from triggering when clicking inside chat window
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-[var(--primary-soft)]/30 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-deep text-white shadow-lg shadow-primary/30">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Ops404 Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Active Now</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearHistory}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    title="Clear History"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-100 scrollbar-track-transparent">
                {messages.length === 0 && !loading && (
                  <div className="flex h-full flex-col items-center justify-center text-center p-4">
                    <div className="rounded-full bg-[var(--primary-soft)] p-4 text-primary mb-4 shadow-inner">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Halo, {user?.name?.split(' ')[0]}!</h4>
                    <p className="text-xs text-slate-500 mt-2 px-6 leading-5">Gue Ops404. Tanya apa aja soal IT support atau data sistem di sini.</p>
                    
                    <div className="mt-8 grid grid-cols-1 gap-2 w-full">
                      {shortcuts.map((s, i) => (
                        <button 
                          key={i} 
                          onClick={() => sendMessage(s.text)} 
                          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3 hover:border-primary hover:bg-white hover:shadow-md transition-all text-left"
                        >
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <s.icon className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={cn("flex w-full mb-1 group/msg", msg.role === 'user' ? "justify-end" : "justify-start")}
                  >
                    <div className="relative max-w-[85%] flex flex-col items-end">
                      <div className={cn(
                        "rounded-2xl px-4 py-3 text-[13.5px] font-medium leading-relaxed shadow-sm break-words whitespace-pre-wrap", 
                        msg.role === 'user' 
                          ? "bg-primary text-white shadow-md shadow-primary/20 rounded-tr-none" 
                          : "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                      )} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {renderContent(msg.content, msg.role)}
                      </div>
                      
                      {/* Copy Button */}
                      <button 
                        onClick={() => copyToClipboard(msg.content, i)}
                        className={cn(
                          "absolute -bottom-6 flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter transition-all opacity-0 group-hover/msg:opacity-100",
                          msg.role === 'user' ? "right-1 text-primary" : "left-1 text-slate-400"
                        )}
                      >
                        {copiedId === i ? (
                          <><Check className="h-3 w-3" /> Copied</>
                        ) : (
                          <><Copy className="h-3 w-3" /> Copy</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl px-4 py-2 flex items-center gap-1">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Footer */}
              <div className="p-4 bg-white/80 border-t border-slate-100">
                <div className="relative">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Tulis pesan..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 pr-14 text-sm outline-none transition-all focus:border-primary/30 focus:bg-white"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="absolute right-1.5 top-1.5 h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button and Helper */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group relative flex items-center cursor-default select-none"
              >
                <div className="rounded-2xl border border-primary/20 bg-[var(--primary-soft)] px-5 py-3 text-[13px] font-bold text-primary shadow-xl shadow-primary/10 backdrop-blur-md ring-1 ring-white/50">
                  Butuh bantuan?
                </div>
                <div className="absolute -right-1 h-2.5 w-2.5 rotate-45 border-r border-t border-primary/20 bg-[var(--primary-soft)]" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-16 w-16 cursor-grab active:cursor-grabbing items-center justify-center rounded-[24px] bg-primary text-white shadow-[0_20px_50px_rgba(15,104,187,0.4)] ring-4 ring-primary/20 transition-all active:shadow-inner"
          >
            {isOpen ? <X className="h-7 w-7" /> : <Bot className="h-7 w-7" />}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
