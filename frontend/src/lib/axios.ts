import axios from 'axios';
import { getSupabaseAccessToken, supabase } from '@/lib/supabase';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api' : '/api');

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const accessToken = await getSupabaseAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch (err) {
    console.error('Failed to get Supabase session token:', err);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        if (pathname !== '/login') {
          if (supabase) await supabase.auth.signOut();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
