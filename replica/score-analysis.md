# Por que tantos sites tiram F (nota 2 a 30 de 100)

Data: 2026-11-09. Fonte: banco local (`tests`, `rule_results`, `requests`), `src/lib/grading.ts`, `worker/measure.ts`.

## Resposta curta
Duas causas juntas, e só uma delas é "culpa do site":

1. **As páginas são pesadas de verdade.** Os números medidos são reais (bytes transferidos pela rede, via `encodedDataLength`). Os sites de órgãos testados têm 4 a 15 MB e 91 a 217 requisições.
2. **A fórmula da nota é dura demais e conta a mesma coisa 4 vezes.** Quatro das seis regras (requisições, peso, imagens, scripts) medem "a página é grande". Uma página grande zera as quatro de uma vez, e a média das seis fica perto de 0.

## Evidência: último teste de cada site (nota = média das 6 regras)

| site | nota | tempo | peso | req | requisições | peso | imagens | scripts | tempo | domínios |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| www5.sefaz.mt.gov.br | 2 | 6,0 s | 13,9 MB | 217 | 0 | 0 | 0 | 0 | 0 | 12 |
| www.ager.mt.gov.br | 5 | 3,8 s | 11,6 MB | 155 | 0 | 0 | 0 | 0 | 29 | 0 |
| www.cge.mt.gov.br | 8 | 3,0 s | 15,6 MB | 176 | 0 | 0 | 0 | 0 | 50 | 0 |
| www.gov.br | 26 | 1,4 s | 7,2 MB | 128 | 0 | 0 | 0 | 0 | 90 | 68 |
| www.receita.fazenda.gov.br | 31 | 0,3 s | 8,9 MB | 91 | 0 | 0 | 0 | 0 | 100 | 84 |
| www.planalto.gov.br | 46 | 0,3 s | 4,1 MB | 104 | 0 | 24 | 61 | 0 | 100 | 92 |
| www.camara.leg.br | 86 | 1,4 s | 1,3 MB | 55 | 50 | 94 | 100 | 100 | 90 | 84 |
| pt.wikipedia.org | 91 | 0,9 s | 0,9 MB | 47 | 66 | 100 | 100 | 82 | 100 | 100 |
| www.tse.jus.br | 100 | 0,1 s | ~0 | 1 | 100 | 100 | 100 | 100 | 100 | 100 |

(As colunas de regra estão na ordem: requisições, peso, imagens, scripts, tempo, domínios.)

Detalhe do pior caso (SEFAZ-MT, 13,9 MB): 103 arquivos JS somam 6,3 MB (um único bundle de 1,5 MB vem de um portal de atendimento de terceiros, `conecta.sefaz.mt.gov.br`), 67 imagens somam 4,1 MB (PNGs de até 827 KB), 22 CSS somam 1,4 MB, 7 fontes somam 1,4 MB (uma fonte `calibri.ttf` de 793 KB). O site é pesado mesmo.

## Onde cada regra chega a zero (`src/lib/grading.ts`)

| regra | fórmula | zera em |
| --- | --- | --- |
| Poucas requisições | 100 − 2 por requisição acima de 30 | 80 requisições |
| Peso total | 100 − 25 por MB acima de 1 MB | 5 MB |
| Imagens leves | 100 − 40 por MB de imagem acima de 0,5 MB | 3 MB de imagens |
| Scripts sob controle | 100 − 6 por script acima de 8 | 25 scripts |
| Tempo de carregamento | 100 − 1 por 40 ms acima de 1 s | 5 s |
| Poucos domínios | 100 − 8 por domínio acima de 6 | 19 domínios |

Não verifiquei nesta sessão as medianas de mercado, mas pelo que sei de memória (a confirmar no relatório público do HTTP Archive) uma página comum hoje fica em torno de 2 a 3 MB e 70 a 100 requisições. Ou seja, **um site típico já perderia metade da nota** com estes limites. Os limites foram escolhidos por mim no início, sem calibrar com sites reais. Isso é uma falha de calibração, não de medição.

## Problemas na medição que também pesam

1. **Tempo e peso medem momentos diferentes.** O tempo (`loadMs`) é parado no evento `load`. Depois disso o worker espera até 10 s pela rede ficar parada (`networkidle`), e **os arquivos que chegam nesse intervalo entram na contagem de peso e requisições, mas não no tempo**. Exemplo: Receita tem 0,3 s de tempo e 8,9 MB / 91 requisições. O 0,3 s provavelmente é só a casca da página, e o resto carrega depois. Resultado: tempo bonito, peso feio. Hoje isso não está explicado ao usuário.
2. **Rodamos 1 execução só**, sem cache, de um servidor de teste (um local, sa-east). Pode haver banners de cookies, rastreadores e anúncios que um visitante real não carregaria do mesmo jeito.
3. **Resultado do TSE (nota 100 com 1 requisição) é quase certamente página de bloqueio**, não o site real. Hoje o app dá A a uma página que não conseguiu ver. Precisa de um aviso.
4. **A nota não diz o que fazer primeiro.** Todas as regras zeradas parecem iguais; o usuário não sabe se o problema são imagens ou scripts.

## O que precisa ser feito (em ordem de valor)

1. **Recalibrar os limites com sites reais** (S). Pegar 20 a 30 sites conhecidos, ver a distribuição, e fazer 90+ valer para "melhor que a maioria" e F só para "muito pior que a maioria". Sugestão inicial para testar: peso zera em 15 MB (não 5), requisições em 200 (não 80), scripts em 60 (não 25), imagens em 8 MB (não 3). Escala suave em vez de queda linear íngreme.
2. **Parar de contar a mesma coisa 4 vezes** (S). Juntar peso, imagens e requisições num grupo "tamanho" com peso total de uma regra, ou dar pesos diferentes na média (tempo pesa mais que domínios).
3. **Alinhar tempo e peso** (M). Mostrar os dois momentos: "Carregou em 0,3 s (evento load)" e "terminou de baixar em X s (rede parada)", e usar o mesmo recorte nas duas medidas ou explicar a diferença na tela.
4. **Avisar quando a página parece bloqueio** (S). Se vier 1 requisição e menos de ~5 KB, ou status 403/429/503 no documento principal, mostrar "o site pode ter bloqueado o teste" em vez da nota.
5. **Mostrar o maior vilão primeiro** (S). "Os 3 arquivos mais pesados" e "o que mais pesa por tipo" no topo do relatório. Os dados já existem na tabela `requests`.
6. **Dar a escolha do perfil** (M, futuro). Perfil de celular e conexão lenta, e um modo "bloquear rastreadores" para ver o peso do próprio site.

## Cuidado
Mudar os limites muda a nota de todos os testes antigos só se for recalculada; as notas já salvas ficam como estão. Depois de recalibrar, refazer os testes e rever `replica/parity.md` e o texto da página inicial ("Seis regras...").

## Aplicado em 2026-11-09 (itens 1 e 2)

**Amostra de calibração:** 15 sites públicos medidos pelo app (gov, notícias, bancos, e-commerce, Wikipédia, GitHub, Apple, Google, YouTube). Mediana: cerca de 4,5 MB e 133 requisições, medidas a frio. Meus palpites antigos (2 a 3 MB, 70 a 100 requisições) estavam abaixo da realidade medida. Ficaram de fora da calibração Stack Overflow, Mercado Livre, Magalu, NYTimes e Reddit: voltaram com 2 a 9 requisições, quase certamente bloquearam o teste.

**Novos limites** (`LIMITS` em `src/lib/grading.ts`; 100 até o primeiro valor, 0 a partir do segundo, reta no meio):

| regra | peso | 100 até | 0 a partir de |
| --- | --- | --- | --- |
| Tempo de carregamento | 3 | 2 s | 10 s |
| Peso total | 2 | 1,5 MB | 12 MB |
| Requisições | 1 | 50 | 300 |
| Imagens | 1 | 1 MB | 8 MB |
| Scripts | 1 | 15 | 80 |
| Domínios | 1 | 10 | 40 |

A nota é a média ponderada. O tempo vale 3 e os domínios 1; as três regras de tamanho (peso, requisições, imagens) juntas valem 4 de 9 em vez de 4 de 6, e o peso total vale mais que as outras duas.

**Resultado na amostra (28 sites, incluindo os que bloquearam):** A 9, B 4, C 5, D 5, F 6. Antes, 9 dos 9 sites de órgãos testados primeiro tiravam F ou D. Agora SEFAZ-MT 35, ager.mt 47, cge.mt 47 (F, páginas de 11 a 15 MB), gov.br 75 (C), Receita 72 (C), Planalto 89 (B), Câmara 100, BB 79, Caixa 81, Nubank 73.

**Testes:** `e2e/grading.spec.ts` (G1 a G7) fixa a curva, o caso "página pesada típica não é F", e "página muito pesada e lenta ainda é F". Suíte completa: 102 passam.

**Ainda aberto:** itens 3 a 6 acima. Em especial o item 4 (avisar bloqueio): sem ele, páginas bloqueadas (TSE, Reddit, Mercado Livre) ainda recebem nota A.
