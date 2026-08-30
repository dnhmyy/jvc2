'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  BookOpen, 
  Wifi, 
  Sparkles
} from 'lucide-react';
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

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cachedMessages = readSessionCache<Message[]>(CHATBOT_HISTORY_CACHE_KEY, CHATBOT_HISTORY_CACHE_TTL);

    if (cachedMessages) {
      setMessages(cachedMessages);
    }

    fetchHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/chatbot/history');
      setMessages(res.data.messages);
      writeSessionCache(CHATBOT_HISTORY_CACHE_KEY, res.data.messages);
    } catch {}
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
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Gagal kirim pesan. Coba lagi ya.' }]);
    } finally {
      setLoading(false);
    }
  };

  const shortcuts = [
    { label: 'Cek WiFi', icon: Wifi, text: 'Gue butuh password wifi cabang...' },
    { label: 'Cari Guide', icon: BookOpen, text: 'Cara benerin printer macet gimana ya?' },
    { label: 'Tambah Akses', icon: Plus, text: 'Mau simpan password router baru nih' },
    { label: 'Audit Log', icon: ShieldCheck, text: 'Siapa aja yang terakhir ubah password?' },
  ];

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 overflow-hidden p-2 lg:p-4">
      <div className="flex items-center justify-between rounded-[28px] border border-[var(--border)] bg-white/80 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-deep text-white shadow-lg shadow-primary/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">Vibe AI Assistant</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Online • Gemini 2.0 Flash</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          aria-label="Clear chat history"
          className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex flex-1 flex-col rounded-[32px] border border-[var(--border)] bg-white/60 shadow-inner backdrop-blur-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            {messages.length === 0 && !loading && (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <Sparkles className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold">Halo, {user?.name}!</h2>
                <p className="text-slate-500 mt-2">Gue siap bantu urusan IT lo. Mau nanya apa hari ini?</p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shortcuts.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s.text)} className="flex items-center gap-3 rounded-2xl border bg-white/80 p-4 hover:shadow-md transition-all">
                      <s.icon className="h-5 w-5 text-slate-600" />
                      <span className="text-sm font-semibold">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn("rounded-3xl px-5 py-3 text-sm max-w-[80%]", msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none")}>
                    {msg.content}
                  </div>
                </div>
              ))}
            {loading && <div className="text-slate-400 text-xs animate-pulse">Vibe AI sedang mengetik...</div>}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t bg-white/80">
            <div className="relative max-w-4xl mx-auto">
              <label htmlFor="chatbot-message" className="sr-only">
                Ask Vibe AI a question
              </label>
              <input
                id="chatbot-message"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Tanya apa aja..."
                className="w-full rounded-2xl border p-4 pr-14 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => sendMessage()}
                aria-label="Send message"
                className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-white"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
