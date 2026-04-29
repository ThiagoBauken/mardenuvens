# Céu de Nuvens

Site simples que responde uma pergunta: **vai ter mar de nuvens nessa montanha, e quando?**

Funciona pra mais de 130 destinos brasileiros (morros, picos, serras, cânions, chapadas, mirantes) cobrindo todos os 27 estados — de Cambirela a Monte Roraima, passando por Itaimbezinho, Pedra do Baú, Chapada Diamantina, Pico da Bandeira, Pico da Neblina e muito mais.

## Features

- **Previsão de 7 dias** com veredito (SIM/PROVÁVEL/TALVEZ/NÃO), janela horária e bullets explicativos.
- **Comparar 2-3 destinos** lado a lado.
- **Favoritar** destinos (localStorage).
- **URL com hash** (`#/m/cambirela`, `#/compare/itaimbezinho,morro-pai-inacio`) para compartilhar.
- **Relatos da comunidade**: depois que o dia passa, qualquer um pode dizer se realmente teve mar de nuvens (sem cadastro).
- **Sem login, sem cookies de rastreio.**

## Como funciona

```
┌──────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│  Frontend React  │ ──HTTP─▶│  Backend Node/TS     │ ──HTTP─▶│  Open-Meteo API │
│  (1 tela só)     │         │  Fastify             │         │  (ECMWF/GFS)    │
│                  │         │  - Cache TTL 1h      │         └─────────────────┘
│  - Lista montes  │         │  - Algoritmo SoC     │
│  - Card previsão │         │  - SQLite (relatos)  │
└──────────────────┘         └──────────────────────┘
```

- **Backend** (Fastify + TypeScript): toda a inteligência. Serve `/api/*` e, em produção, também serve os estáticos do frontend no mesmo container.
- **Frontend** (React + Vite + Tailwind): só renderização.
- **API meteorológica:** [Open-Meteo](https://open-meteo.com/) (gratuita, modelo ECMWF IFS 0.25°).
- **Persistência:** SQLite via `better-sqlite3`, arquivo único em `/app/data/ceunuvens.db`.

## Desenvolvimento

```bash
# instala dependências dos dois workspaces
npm install

# roda backend (porta 7777) + frontend (porta 7778+) em paralelo
npm run dev
```

Backend em `http://localhost:7777`, frontend em `http://localhost:7778` (Vite escolhe automaticamente se ocupada). O Vite faz proxy de `/api/*` para o backend.

### Endpoints

| Método | Rota | O quê |
|---|---|---|
| GET | `/health` | Healthcheck |
| GET | `/api/mountains` | Catálogo dos 130+ destinos |
| GET | `/api/forecast/:id` | Previsão de 7 dias com veredito + janela + reasoning |
| GET | `/api/reports/:id` | Últimos 50 relatos do destino |
| GET | `/api/reports/:id/:date` | Relatos do destino numa data + sumário (yes/no) |
| POST | `/api/reports` | Cria um relato. Body: `{mountainId, reportDate, happened, comment?, authorName?}` |

Limites de moderação: 1 relato por IP por (destino, dia); máximo 5 relatos por IP por hora.

## Variáveis de ambiente

| Var | Default | O quê |
|---|---|---|
| `PORT` | `7777` (dev) / `3000` (Docker) | Porta HTTP |
| `HOST` | `0.0.0.0` | Bind |
| `DB_PATH` | `./data/ceunuvens.db` | Arquivo SQLite |
| `FRONTEND_DIR` | auto-detecta | Onde estão os estáticos a servir |
| `IP_HASH_SALT` | valor fraco padrão | **Trocar em produção!** Sal pra hash de IP |

## Deploy via Docker (EasyPanel ou qualquer host)

O `Dockerfile` na raiz empacota frontend + backend num único container.

### Build local (se quiser testar):

```bash
docker build -t ceunuvens .
docker run -p 3000:3000 -v ceunuvens-data:/app/data \
  -e IP_HASH_SALT="<gere-um-valor-aleatorio-aqui>" \
  ceunuvens
```

Depois acesse `http://localhost:3000`.

### Deploy no EasyPanel

1. **Criar um novo App** do tipo "App" (ou "Compose").
2. **Source:** apontar para o repositório Git deste projeto.
3. **Build:** EasyPanel detecta o `Dockerfile` automaticamente. Sem comando custom.
4. **Porta:** `3000`.
5. **Volumes:** criar um volume e montar em `/app/data` — é onde fica o SQLite. Sem isso, os relatos somem a cada redeploy.
6. **Variáveis de ambiente:**
   - `IP_HASH_SALT` = um valor aleatório longo (use `openssl rand -hex 32`).
   - Opcional: `PORT` se quiser mudar (default 3000).
7. **Health check:** EasyPanel pode usar `GET /health` (já há `HEALTHCHECK` no Dockerfile, mas configurar no painel também não atrapalha).
8. **Deploy.**

Primeira request pra `/api/forecast/<id>` demora ~300ms (chama Open-Meteo). Subsequentes da mesma montanha em <1h são <1ms (cache em memória).

### Backup do banco

O arquivo `ceunuvens.db` no volume é tudo que precisa para backup. Pode copiá-lo enquanto o app está rodando — SQLite WAL é seguro pra leitura concorrente.

## Limitações conhecidas

- Algoritmo é heurística amadora baseada em literatura de divulgação, não validada cientificamente.
- Open-Meteo ECMWF roda em ~25 km de resolução — relevo fino dos tepuis e morros não é totalmente capturado.
- Mar de nuvens depende de microclima noturno; modelos globais subestimam.
- Os relatos da comunidade são abertos sem moderação. Spam é mitigado por rate limiting básico (5/hora por IP, 1 por destino-dia por IP), mas não há painel de moderação ainda.
- Cache em memória — se rodar múltiplas réplicas atrás de um load balancer, cada uma terá seu próprio cache (não é crítico, só menos eficiente).

## Próximos passos sugeridos

- Painel de moderação simples (apagar relatos abusivos via token admin).
- Notificação por e-mail quando um destino favorito atinge SIM/PROVÁVEL.
- Anexar foto ao relato (S3 ou backblaze).
- Calibrar pesos do algoritmo com regressão logística sobre relatos reais.
