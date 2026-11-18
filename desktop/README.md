# Quantoleva Desktop

A versão de **aplicativo de desktop** do Quantoleva (Windows): você abre, cola um endereço
e vê a nota, o tempo, o peso e cada arquivo da página — **sem Docker, sem banco, sem servidor**.
O navegador de medição (Chromium) vai embutido no instalador.

## Como difere da versão web

| | Web (`../`) | Desktop (esta pasta) |
| --- | --- | --- |
| Banco | Postgres (Docker) | nenhum (mede na hora) |
| Fila/worker | sim | não (mede direto) |
| Rede | bloqueia IPs internos | livre — mede até `localhost` |
| Uso | hospedado, para várias pessoas | um aplicativo no seu PC |

A lógica de medição e de nota é a mesma do projeto web (`src/measure.js`, `src/grading.js`).

## Rodar em desenvolvimento

```bash
npm install
npx playwright install chromium   # baixa o navegador de medição (uma vez)
npm start
```

## Gerar o instalador (.exe)

O instalador embute o Chromium, então o app roda em qualquer Windows sem instalar mais nada.

```bash
# 1. Copie o Chromium "headless shell" para dentro do projeto, em ms-playwright/
#    (de %LOCALAPPDATA%\ms-playwright\chromium_headless_shell-<versão> e winldd-<versão>)
# 2. Gere o instalador:
npm run dist
```

O instalador sai em `dist/Quantoleva Setup <versão>.exe`.

## Estrutura

```
main.js        Processo principal (janela + atende o pedido de medição)
preload.js     Ponte segura entre a tela e o processo principal
src/measure.js Mede a página num Chromium real (via CDP)
src/grading.js Calcula a nota (0–100) e as seis regras
src/run-test.js Junta medição + nota
renderer/      A tela (HTML, CSS, JS)
```
