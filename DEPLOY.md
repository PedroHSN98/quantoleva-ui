# Colocar o Quantoleva online (Render)

O app tem **três peças**: o site (Next.js), o banco (Postgres) e o **worker** (processo
que abre o Chromium e mede as páginas). O arquivo `render.yaml` cria as três de uma vez.

## Passo a passo

1. **Suba o código para o GitHub** (o repositório já existe). Confira que estes arquivos
   estão commitados: `render.yaml`, `Dockerfile.worker`, `.dockerignore`, `package.json`.

2. **Crie uma conta no Render** → https://render.com (dá para entrar com o GitHub).

3. No painel: **New → Blueprint**. Escolha este repositório. O Render lê o `render.yaml`
   e mostra os 3 serviços que vai criar (`quantoleva-db`, `quantoleva-web`, `quantoleva-worker`).

4. Clique em **Apply**. O Render então:
   - cria o Postgres e injeta a `DATABASE_URL` no site e no worker automaticamente;
   - builda o site, **roda as migrations** (`preDeployCommand`) e sobe o `next start`;
   - builda a imagem do worker (com o Chromium) e o mantém rodando.

5. Quando o `quantoleva-web` ficar **"Live"**, abra a URL que o Render deu
   (algo como `https://quantoleva-web.onrender.com`). Pronto — qualquer pessoa com o link usa.

## Conferir que o worker está ativo

Nos logs do `quantoleva-worker` deve aparecer `worker started, location=us-east`.
Se no site aparecer "nenhum servidor de teste disponível", é o worker que não subiu —
olhe os logs dele.

## Domínio próprio (opcional)

No serviço `quantoleva-web` → **Settings → Custom Domains**, adicione seu domínio e
aponte o DNS conforme o Render indicar. O HTTPS é automático.

## Custos (ordem de grandeza)

- **Postgres**: grátis por 30 dias; depois ~US$ 6/mês (plano `basic-256mb`).
- **Web (starter)**: ~US$ 7/mês.
- **Worker (starter)**: ~US$ 7/mês — precisa ficar ligado o tempo todo.

Para reduzir: dá para rodar site e worker no mesmo serviço só em testes, mas em produção
convém mantê-los separados.

## Observações importantes

- **De onde a medição "sai"**: o worker mede a partir do datacenter do Render (Virgínia, EUA),
  por isso `WORKER_LOCATION=us-east`. Se você quiser medir **de São Paulo**, o Render não tem
  região no Brasil — nesse caso o **Fly.io** tem a região `gru` (São Paulo) e o mesmo
  `Dockerfile.worker` serve lá.
- **Concorrência do worker**: cada teste é um Chrome inteiro (~300 MB). No plano starter
  deixe `WORKER_CONCURRENCY=1`. Para rodar mais testes ao mesmo tempo, suba o plano e o número.
- **Segurança**: o app já tem proteção contra SSRF (não deixa testar endereços internos) e
  limite de 15 testes por IP a cada 10 minutos. Revise `src/lib/ssrf.ts` antes de divulgar.
