<div align="center">

![Quantoleva](docs/home.png)

# Quantoleva

### Quanto leva para a sua página carregar?

Teste de velocidade de páginas que carrega o site num **navegador de verdade, sem cache**,
e mostra o tempo, o peso e **cada arquivo** que a página pede — com nota de 0 a 100,
Core Web Vitals, uma tira de imagens do carregamento e dicas do que melhorar.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![Electron](https://img.shields.io/badge/Electron-33-47848f)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Playwright](https://img.shields.io/badge/Playwright-1.65-2ead33)

</div>

---

## O que faz

- 🌐 Mede **qualquer página pública** num Chromium real, como um visitante novo (sem cache).
- 📊 Dá **nota, tempo de carga, peso e número de requisições**, com a linha do tempo de cada arquivo.
- ⚡ **Core Web Vitals** (LCP, FCP, CLS, TBT, TTFB) com faixa bom / a melhorar / ruim.
- 🎞️ **Filmstrip**: uma tira de imagens mostrando a página aparecendo ao longo do tempo.
- 🩺 **Diagnóstico**: compressão, cache, redirecionamentos, conteúdo misto, segurança e protocolo.
- 🍩 **Do que a página é feita**: peso por tipo de arquivo e quais domínios mais pedem recursos.
- 📈 **Evolução**: como a nota e o tempo do mesmo endereço mudaram entre os testes.
- 🧩 Testa **vários endereços de uma vez** e compara lado a lado.
- 📄 Exporta o relatório (CSV/PDF) e gera um **link compartilhável** (só na versão web).

---

## Duas versões

Você pode usar do jeito que preferir:

| | 🖥️ **App de Desktop** (pasta `desktop/`) | 🌐 **Site** (raiz do projeto) |
| --- | --- | --- |
| Para quê | Usar no seu PC, rápido | Hospedar para várias pessoas |
| Instalação | **Só Node** | Node + Docker |
| Banco de dados | Nenhum (mede na hora) | Postgres |
| Mais fácil de rodar | ✅ **Sim, comece por aqui** | Precisa de mais passos |

A lógica de medição e de nota é a mesma nas duas.

---

## 🚀 Passo a passo do zero (para quem nunca fez isso)

Siga na ordem. Serve para **Windows, macOS e Linux**.

### Passo 1 — Instalar o Node.js

1. Acesse **https://nodejs.org** e baixe a versão **LTS** (o botão da esquerda).
2. Abra o arquivo baixado e vá clicando em **Avançar** até concluir a instalação.
3. Para conferir se deu certo, abra o **terminal** e digite:
   - **Windows:** abra o menu Iniciar, procure por **PowerShell** e abra.
   - **macOS:** abra o **Terminal**.

   ```bash
   node -v
   ```
   Se aparecer um número como `v22.x.x`, está instalado. 👍

### Passo 2 — Baixar o projeto

**Opção A — sem programa nenhum (mais fácil):**
1. Abra https://github.com/PedroHSN98/quantoleva-ui
2. Clique no botão verde **Code** → **Download ZIP**.
3. Descompacte o arquivo numa pasta à sua escolha (ex.: `Documentos`).

**Opção B — com Git** (se você tiver o [Git](https://git-scm.com) instalado):
```bash
git clone https://github.com/PedroHSN98/quantoleva-ui.git
```

### Passo 3 — Abrir a pasta do projeto no terminal

No terminal, entre na pasta que você baixou. Exemplo:
```bash
cd Documentos/quantoleva-ui
```
> Dica: digite `cd ` (com espaço) e **arraste a pasta** para dentro do terminal — o caminho é preenchido sozinho.

### Passo 4 — Rodar

Agora é só seguir **uma** das duas opções abaixo:
- **App de Desktop** (mais fácil, recomendado) 👇
- **Site** (mais abaixo) — se quiser a versão web com link compartilhável.

---

## 🖥️ Rodar o App de Desktop (jeito mais fácil)

**Precisa de:** só o Node.js (Passo 1 acima).

A partir da pasta do projeto (Passo 3), rode:

```bash
# 1. Entre na pasta do app de desktop
cd desktop

# 2. Instale as dependências (demora um pouco na primeira vez)
npm install

# 3. Baixe o navegador de medição (só na primeira vez)
npx playwright install chromium

# 4. Abra o aplicativo
npm start
```

Pronto — a janela do Quantoleva abre, você cola um endereço e clica em **Medir**. 🎉

> **Nas próximas vezes** você só precisa de `cd desktop` e `npm start` — os passos 2 e 3 são uma vez só.

> **Gerar um instalador `.exe`** (para abrir o app sem precisar do Node): veja o
> passo a passo em [`desktop/README.md`](desktop/README.md).

---

## 🌐 Rodar o Site

**Precisa de:** Node.js (Passo 1) e [Docker](https://www.docker.com) instalado e aberto (para o banco de dados).

A partir da pasta do projeto (Passo 3):

```bash
# 1. Dependências
npm install
npx playwright install chromium

# 2. Configuração: copie o modelo e preencha IP_HASH_SECRET com qualquer texto longo
cp .env.example .env.local

# 3. Banco de dados (sobe o Postgres em container e cria as tabelas)
npm run db:up
npm run db:migrate
```

Depois, abra **dois terminais**:

```bash
# Terminal 1 — o site
npm run dev        # abre em http://localhost:3000

# Terminal 2 — o medidor (quem abre o Chromium e mede as páginas)
npm run worker
```

> Sem o `worker` rodando, o site mostra "nenhum servidor de teste disponível": é ele quem mede.

---

## ❓ Problemas comuns

<details>
<summary><strong>"node" ou "npm" não é reconhecido como comando</strong></summary>

O Node.js não foi instalado ou o terminal foi aberto antes da instalação.
**Feche e abra o terminal de novo** e tente `node -v`. Se ainda não funcionar,
reinstale pelo https://nodejs.org (versão LTS).
</details>

<details>
<summary><strong>O <code>npm install</code> deu erro</strong></summary>

Quase sempre é internet instável ou um download que caiu no meio. Tente:
1. Confirme que você está conectado à internet.
2. Rode o comando de novo: `npm install`.
3. Se insistir, limpe o cache e tente mais uma vez:
   ```bash
   npm cache clean --force
   npm install
   ```
</details>

<details>
<summary><strong>No app de desktop, a página não é medida / fica dando erro</strong></summary>

Falta o navegador de medição. Dentro da pasta `desktop`, rode uma vez:
```bash
npx playwright install chromium
```
Depois abra o app de novo com `npm start`.
</details>

<details>
<summary><strong>No site aparece "nenhum servidor de teste disponível"</strong></summary>

O medidor (**worker**) não está rodando. O site precisa de **dois terminais abertos
ao mesmo tempo**: um com `npm run dev` e outro com `npm run worker`. Abra o segundo
terminal, entre na pasta do projeto e rode `npm run worker`.
</details>

<details>
<summary><strong>No site: erro de banco de dados / o <code>npm run db:up</code> falha</strong></summary>

O banco roda dentro do **Docker**, então o Docker precisa estar **instalado e aberto**.
Abra o Docker Desktop, espere ele terminar de iniciar e rode `npm run db:up` de novo.
</details>

<details>
<summary><strong>"porta 3000 já está em uso" (site)</strong></summary>

Já existe algo rodando nessa porta (talvez um `npm run dev` que ficou aberto).
Feche o outro terminal, ou rode o site em outra porta:
```bash
npm run dev -- -p 3001
```
Aí o endereço passa a ser `http://localhost:3001`.
</details>

<details>
<summary><strong>Fechei tudo. Como abro de novo?</strong></summary>

Não precisa instalar nada de novo. Abra o terminal, entre na pasta do projeto e:
- **Desktop:** `cd desktop` e depois `npm start`.
- **Site:** `npm run dev` num terminal e `npm run worker` noutro (com o Docker aberto).
</details>

---

## Telas

| Página inicial | Relatório |
| --- | --- |
| ![Home](docs/home.png) | ![Resultado](docs/resultado.png) |

---

## Scripts (site)

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Site em modo desenvolvimento |
| `npm run build` / `npm start` | Build e execução de produção |
| `npm run worker` | Medidor de páginas (usa `.env.local`) |
| `npm run db:up` | Sobe o Postgres via Docker |
| `npm run db:migrate` | Cria/atualiza as tabelas |
| `npm run typecheck` | Checa os tipos (TypeScript) |

## Como funciona (site)

O projeto web tem **três peças** que rodam juntas:

| Peça | Pasta | Função |
| --- | --- | --- |
| **Web** (Next.js) | `src/` | O site e a API |
| **Postgres** | `migrations/` | Guarda testes, resultados e locais |
| **Worker** | `worker/` | Abre o Chromium (Playwright) e mede as páginas |

O site cria um teste na fila; o worker pega o teste, mede e grava o resultado.
A página de resultado acompanha o progresso em tempo real.

## Colocar o site online

Para hospedar (site + banco + worker), veja **[DEPLOY.md](DEPLOY.md)** — inclui um
`render.yaml` pronto e o passo a passo.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · PostgreSQL · Playwright · Electron · Zod · Docker.
