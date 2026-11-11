<div align="center">

![Quantoleva](docs/home.png)

# Quantoleva

### Quanto leva para a sua página carregar?

Teste de velocidade de páginas que carrega o site num **navegador de verdade, sem cache**,
e mostra o tempo, o peso e **cada arquivo** que a página pede — com uma nota de 0 a 100 e dicas do que melhorar.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Postgres](https://img.shields.io/badge/Postgres-16-336791)
![Playwright](https://img.shields.io/badge/Playwright-1.65-2ead33)

</div>

---

## O que faz

- 🌐 Mede **qualquer página pública** num Chromium real, carregada como um visitante novo (sem cache).
- 📊 Entrega **nota, tempo de carga, peso e número de requisições**, com a linha do tempo de cada arquivo (DNS, conexão, SSL, espera, recebimento).
- 🧭 Mostra **de onde o teste saiu** (o resultado muda com a distância até o servidor).
- 🧩 Testa **vários endereços de uma vez** e compara lado a lado.
- 📝 **Uma nota que explica**: seis regras, cada uma com pontuação e uma dica quando está abaixo de 90, além de um plano "como chegar a 100/100".
- 📄 **Exporta** o relatório em CSV e em PDF.
- 🔗 Cada resultado tem um **link compartilhável** (com card de pré-visualização nas redes).
- ♿ Tema claro/escuro e cuidado com acessibilidade.
- 🙅 Sem conta, sem cartão.

## Telas

| Página inicial | Relatório |
| --- | --- |
| ![Home](docs/home.png) | ![Resultado](docs/resultado.png) |

## Como funciona

O projeto tem **três peças** que rodam juntas:

| Peça | Pasta | Função |
| --- | --- | --- |
| **Web** (Next.js) | `src/` | O site e a API |
| **Postgres** | `migrations/` | Guarda testes, resultados e locais |
| **Worker** | `worker/` | Abre o Chromium (Playwright) e mede as páginas |

O site cria um teste na fila; o worker reivindica o teste do seu local, mede e grava o resultado.
A página de resultado acompanha o progresso em tempo real.

## Rodando localmente

**Pré-requisitos:** [Node.js](https://nodejs.org) 22+, [Docker](https://www.docker.com) e o Chromium do Playwright.

```bash
# 1. Dependências
npm install
npx playwright install chromium

# 2. Configuração (copie e preencha IP_HASH_SECRET com qualquer texto longo)
cp .env.example .env.local

# 3. Banco de dados (sobe o Postgres em container e aplica as migrations)
npm run db:up
npm run db:migrate
```

Depois, em **dois terminais**:

```bash
npm run dev      # site em http://localhost:3000
npm run worker   # o processo que mede as páginas
```

> Sem o `worker` rodando, o site mostra "nenhum servidor de teste disponível": é ele quem faz as medições.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Site em modo desenvolvimento |
| `npm run build` / `npm start` | Build e execução de produção |
| `npm run worker` | Worker de medição (usa `.env.local`) |
| `npm run db:up` | Sobe o Postgres via Docker |
| `npm run db:migrate` | Aplica as migrations |
| `npm run typecheck` | Checa os tipos (TypeScript) |

## Deploy

Para colocar online (site + banco + worker), veja **[DEPLOY.md](DEPLOY.md)** — inclui um
`render.yaml` pronto e o passo a passo.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · PostgreSQL · Playwright · Zod · Docker.
