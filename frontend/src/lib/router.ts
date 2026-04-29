import { useEffect, useState } from 'react';

export type Route =
  | { kind: 'home' }
  | { kind: 'mountain'; id: string }
  | { kind: 'compare'; ids: string[] }
  | { kind: 'about' };

export function parseUrl(pathname: string): Route {
  const p = pathname.replace(/^\/+|\/+$/g, '');
  if (!p) return { kind: 'home' };

  const [head, rest = ''] = p.split('/');

  if (head === 'm' && rest) {
    return { kind: 'mountain', id: decodeURIComponent(rest) };
  }
  if (head === 'sobre') {
    return { kind: 'about' };
  }
  if (head === 'compare' && rest) {
    const ids = rest
      .split(',')
      .map((s) => decodeURIComponent(s.trim()))
      .filter(Boolean)
      .slice(0, 3);
    if (ids.length === 0) return { kind: 'home' };
    return { kind: 'compare', ids };
  }
  return { kind: 'home' };
}

export function buildPath(route: Route): string {
  switch (route.kind) {
    case 'home':
      return '/';
    case 'mountain':
      return `/m/${encodeURIComponent(route.id)}`;
    case 'compare':
      return `/compare/${route.ids.map(encodeURIComponent).join(',')}`;
    case 'about':
      return '/sobre';
  }
}

/**
 * Compatibilidade: se a URL veio com hash antigo (#/m/...), redireciona
 * silenciosamente pra path equivalente — links compartilhados antes da
 * migração continuam funcionando.
 */
function migrateLegacyHash(): boolean {
  if (!window.location.hash) return false;
  const h = window.location.hash.replace(/^#\/?/, '');
  if (!h) return false;
  const [head] = h.split('/');
  if (head !== 'm' && head !== 'compare') return false;
  const newPath = '/' + h;
  window.history.replaceState(null, '', newPath);
  return true;
}

export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => {
    migrateLegacyHash();
    return parseUrl(window.location.pathname);
  });

  useEffect(() => {
    const onPop = (): void => setRoute(parseUrl(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (r: Route): void => {
    const next = buildPath(r);
    if (next !== window.location.pathname) {
      window.history.pushState(null, '', next);
      setRoute(r);
      window.scrollTo(0, 0);
    }
  };

  return [route, navigate];
}
