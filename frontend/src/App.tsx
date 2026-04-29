import { lazy, Suspense } from 'react';
import { MountainPicker } from './components/MountainPicker';
import { useHashRoute } from './lib/router';

// Lazy-loaded: views entram no bundle só quando o usuário navega pra elas.
// Reduz o JS inicial de ~172KB pra ~80KB.
const ForecastView = lazy(() =>
  import('./components/ForecastView').then((m) => ({ default: m.ForecastView })),
);
const ComparisonView = lazy(() =>
  import('./components/ComparisonView').then((m) => ({ default: m.ComparisonView })),
);
const Highlights = lazy(() =>
  import('./components/Highlights').then((m) => ({ default: m.Highlights })),
);
const AboutPage = lazy(() =>
  import('./components/AboutPage').then((m) => ({ default: m.AboutPage })),
);

function ViewFallback(): JSX.Element {
  return <div className="text-cloud-dim animate-pulse">Carregando…</div>;
}

export function App(): JSX.Element {
  const [route, navigate] = useHashRoute();

  return (
    <div className="min-h-full">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        {route.kind === 'home' && (
          <>
            <header className="mb-8 sm:mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Vai ter <span className="text-sky-300">mar de nuvens</span>?
              </h1>
              <p className="text-cloud-dim mt-2">
                Previsão para morros, picos, serras, cânions e mirantes do Brasil. Escolha o destino:
              </p>
            </header>
            <Suspense fallback={null}>
              <Highlights onSelect={(id) => navigate({ kind: 'mountain', id })} />
            </Suspense>
            <MountainPicker
              onSelect={(id) => navigate({ kind: 'mountain', id })}
              onCompare={(ids) => navigate({ kind: 'compare', ids })}
            />
          </>
        )}

        {route.kind === 'mountain' && (
          <Suspense fallback={<ViewFallback />}>
            <ForecastView
              mountainId={route.id}
              onBack={() => navigate({ kind: 'home' })}
            />
          </Suspense>
        )}

        {route.kind === 'compare' && (
          <Suspense fallback={<ViewFallback />}>
            <ComparisonView
              ids={route.ids}
              onBack={() => navigate({ kind: 'home' })}
              onOpen={(id) => navigate({ kind: 'mountain', id })}
            />
          </Suspense>
        )}

        {route.kind === 'about' && (
          <Suspense fallback={<ViewFallback />}>
            <AboutPage onBack={() => navigate({ kind: 'home' })} />
          </Suspense>
        )}

        <footer className="mt-16 pt-6 border-t border-sky-soft/30 text-xs text-cloud-dim/70 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            Dados via{' '}
            <a
              href="https://open-meteo.com/"
              className="underline hover:text-cloud"
              target="_blank"
              rel="noreferrer"
            >
              Open-Meteo
            </a>{' '}
            (ECMWF). Heurística amadora — informação, não garantia.
          </span>
          <span aria-hidden>·</span>
          <a
            href="/sobre"
            onClick={(e) => {
              e.preventDefault();
              navigate({ kind: 'about' });
            }}
            className="underline hover:text-cloud"
          >
            Sobre o site
          </a>
          <span aria-hidden>·</span>
          <a
            href="https://github.com/ThiagoBauken/mardenuvens"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-cloud"
          >
            GitHub
          </a>
        </footer>
      </main>
    </div>
  );
}
