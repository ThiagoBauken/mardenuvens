import { useDocumentTitle, useDocumentMeta } from '../lib/useDocumentTitle';

interface Props {
  onBack: () => void;
}

export function AboutPage({ onBack }: Props): JSX.Element {
  useDocumentTitle('Sobre — Mar de Nuvens');
  useDocumentMeta(
    'description',
    'Como funciona a previsão de mar de nuvens: variáveis meteorológicas, fontes de dados, algoritmo, limitações e privacidade.',
  );

  return (
    <article className="space-y-8 max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="text-cloud-dim hover:text-cloud text-sm flex items-center gap-1"
      >
        ← Voltar
      </button>

      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Sobre o site</h1>
        <p className="text-cloud-dim mt-3">
          O <strong>Mar de Nuvens</strong> tenta responder uma pergunta simples pra quem
          gosta de subir em montanha: <em>vai ter mar de nuvens nesse cume e quando?</em>
        </p>
      </header>

      <Section title="O que é mar de nuvens">
        <p>
          Quando você está num cume e olha pra baixo enxergando uma camada branca contínua
          parecendo um oceano. Acontece quando uma camada de nuvens baixas fica{' '}
          <strong>presa abaixo</strong> de uma <strong>inversão térmica</strong> — uma
          região da atmosfera onde, por algumas horas, o ar mais quente fica em cima do
          mais frio (o oposto do esperado). Acima dessa inversão, o ar tende a estar seco
          e o céu limpo. Resultado: cume acima das nuvens, sob céu aberto.
        </p>
        <p>
          É um fenômeno noturno-matutino. Forma com o resfriamento da madrugada e dissipa
          quando o sol esquenta a superfície. Por isso a "melhor janela" sempre cai entre
          ~04h e ~10h locais.
        </p>
      </Section>

      <Section title="Como o site decide se vai ter">
        <p>
          Nenhuma API meteorológica entrega esse score pronto. O site combina variáveis
          brutas de modelos numéricos numa heurística com 7 componentes:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5 mt-3">
          <li>
            <strong>Inversão térmica</strong> — temperatura no nível acima do cume
            comparada à esperada pela queda padrão (6,5 °C/km). Quanto maior a
            inversão, mais estável a camada de nuvens.
          </li>
          <li>
            <strong>Umidade abaixo do cume</strong> — ar saturado embaixo é
            necessário pra formar a camada.
          </li>
          <li>
            <strong>Ar seco acima do cume</strong> — sem isso, o cume também fica
            envolto em nuvens.
          </li>
          <li>
            <strong>Cobertura de nuvens baixas</strong> — &gt;50%: existe camada pra
            "olhar de cima".
          </li>
          <li>
            <strong>Sem nuvens médias/altas</strong> — pra você ver céu limpo lá em
            cima também.
          </li>
          <li>
            <strong>Vento fraco</strong> — vento forte mistura camadas e destrói a
            inversão.
          </li>
          <li>
            <strong>Base estimada das nuvens abaixo do cume</strong> — calculada pela
            fórmula de Espy: <code>~125 × (T − ponto de orvalho)</code>.
          </li>
        </ol>
        <p className="mt-3">
          Cada componente vira um número entre 0 e 1. Os pesos variam por <strong>perfil
          climático</strong> (subtropical-úmido, equatorial-amazônico, semiárido, cerrado-
          altitude, tropical-de-altitude, tropical-litorâneo, subtropical-cânion) — uma
          inversão "normal" no Pico da Bandeira pesa diferente do que numa serra do
          Cariri ou no Monte Roraima. O score final classifica o dia em SIM, PROVÁVEL,
          TALVEZ ou NÃO.
        </p>
      </Section>

      <Section title="Fontes de dados">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Modelo meteorológico:{' '}
            <a className="underline hover:text-cloud" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>{' '}
            servindo o ECMWF IFS 0.25° (com fallback automático para best_match).
          </li>
          <li>
            Coordenadas e altitudes dos destinos: Wikipedia (PT/EN), OpenStreetMap,
            ICMBio. Onde a coordenada exata do cume não é confiável, usamos a do
            mirante/portaria mais próximo — a resolução do modelo (~25 km) absorve
            pequenos desvios.
          </li>
          <li>
            Relatos da galera: enviados pelos próprios usuários via formulário no card
            de cada dia, salvos no servidor. Não há cadastro.
          </li>
        </ul>
      </Section>

      <Section title="Limitações importantes">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            O algoritmo é <strong>heurística amadora</strong> baseada em literatura de
            divulgação e prática de montanhistas, não validado cientificamente.
          </li>
          <li>
            Resolução do modelo (~25 km) não captura microclima fino: relevo de cânion,
            inversões muito locais, brisa de baía. Esses fatores podem fazer o site
            errar.
          </li>
          <li>
            Mar de nuvens depende fortemente do que aconteceu na madrugada anterior;
            modelos globais frequentemente subestimam.
          </li>
          <li>
            <strong>Use como informação, não como garantia.</strong> Se a vida ou a
            segurança da sua subida depende de visibilidade, complemente com previsão
            local e bom senso.
          </li>
        </ul>
      </Section>

      <Section title="Privacidade">
        <p>
          Sem cadastro, sem cookies de rastreio, sem analytics que identificam
          indivíduos. Seus favoritos ficam apenas no <code>localStorage</code> do seu
          navegador — não saem da sua máquina.
        </p>
        <p>
          Os relatos enviados são públicos e ficam associados apenas ao{' '}
          <strong>hash do seu IP com sal</strong> (não ao IP em si). O hash existe pra
          impedir spam — o servidor consegue saber "esse mesmo IP já postou hoje", mas
          não consegue identificar quem é.
        </p>
      </Section>

      <Section title="Código">
        <p>
          O site é open source.{' '}
          <a
            className="underline hover:text-cloud"
            href="https://github.com/ThiagoBauken/mardenuvens"
            target="_blank"
            rel="noreferrer"
          >
            github.com/ThiagoBauken/mardenuvens
          </a>{' '}
          — pull requests com novos destinos, correção de coordenadas ou melhoria do
          algoritmo são bem-vindos.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="space-y-3 text-cloud/90 leading-relaxed">
      <h2 className="text-xl font-semibold text-cloud border-b border-sky-soft/30 pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}
