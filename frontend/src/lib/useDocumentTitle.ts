import { useEffect } from 'react';

const DEFAULT = 'Mar de Nuvens — Previsão para 150+ montanhas e cânions do Brasil';

export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ?? DEFAULT;
    return () => {
      document.title = DEFAULT;
    };
  }, [title]);
}

export function useDocumentMeta(name: string, content: string | null): void {
  useEffect(() => {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    let created = false;
    if (!el) {
      el = document.createElement('meta');
      el.name = name;
      document.head.appendChild(el);
      created = true;
    }
    const previous = el.content;
    el.content = content;
    return () => {
      if (created) {
        el!.remove();
      } else {
        el!.content = previous;
      }
    };
  }, [name, content]);
}
