import { useEffect, useState } from 'react';

const KEY = 'ceunuvens:favorites';

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function write(set: Set<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // localStorage cheio ou bloqueado — silenciar
  }
}

const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function useFavorites(): {
  favorites: Set<string>;
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
} {
  const [favorites, setFavorites] = useState<Set<string>>(() => read());

  useEffect(() => {
    const listener = (): void => setFavorites(read());
    listeners.add(listener);
    const onStorage = (e: StorageEvent): void => {
      if (e.key === KEY) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const toggle = (id: string): void => {
    const next = new Set(read());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(next);
    emit();
  };

  const isFavorite = (id: string): boolean => favorites.has(id);

  return { favorites, toggle, isFavorite };
}
