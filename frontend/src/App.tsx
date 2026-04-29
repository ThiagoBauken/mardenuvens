import { MountainPicker } from './components/MountainPicker';
import { ForecastView } from './components/ForecastView';
import { ComparisonView } from './components/ComparisonView';
import { Highlights } from './components/Highlights';
import { useHashRoute } from './lib/router';

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
            <Highlights onSelect={(id) => navigate({ kind: 'mountain', id })} />
            <MountainPicker
              onSelect={(id) => navigate({ kind: 'mountain', id })}
              onCompare={(ids) => navigate({ kind: 'compare', ids })}
            />
          </>
        )}

        {route.kind === 'mountain' && (
          <ForecastView
            mountainId={route.id}
            onBack={() => navigate({ kind: 'home' })}
          />
        )}

        {route.kind === 'compare' && (
          <ComparisonView
            ids={route.ids}
            onBack={() => navigate({ kind: 'home' })}
            onOpen={(id) => navigate({ kind: 'mountain', id })}
          />
        )}

        <footer className="mt-16 pt-6 border-t border-sky-soft/30 text-xs text-cloud-dim/70">
          Dados meteorológicos via{' '}
          <a
            href="https://open-meteo.com/"
            className="underline hover:text-cloud"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo
          </a>{' '}
          (modelo ECMWF). Algoritmo heurístico — para informação, não para decisões críticas.
        </footer>
      </main>
    </div>
  );
}
