type CacheEnvelope<T> = {
  timestamp: number;
  data: T;
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function readSessionCache<T>(key: string, maxAgeMs: number): T | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as CacheEnvelope<T>;

    if (!parsed?.timestamp || Date.now() - parsed.timestamp > maxAgeMs) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function writeSessionCache<T>(key: string, data: T) {
  if (!canUseStorage()) {
    return;
  }

  try {
    const payload: CacheEnvelope<T> = {
      timestamp: Date.now(),
      data,
    };

    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage quota and serialization failures.
  }
}
