# Brand

Working name: **Quantoleva** (change in `src/lib/brand.ts` and `replica/brand.json`).
Angle (from `fixes.md`, option A): for site owners who do not trust one number from one place, test from where visitors are, run it three times, show the range. Be careful: only the "real browser, every file" part is true today (one location, one run). Copy must not promise more.

## Names
20 candidates tried. Short dictionary words (Prumo, Triplo, Sondar, Trena, Longitude, Carregou) were all taken on .com, .com.br and GitHub. Dropped `pingmedida` for sounding like the original.

Shortlist of 5, all invented or compound, none echoing the original:
1. **Quantoleva** ("how long does it take", spoken Brazilian Portuguese). Recommended: easy to say and remember, fits "time" and a casual voice.
2. **Veloscópio** (velocity + scope, invented). Distinctive, more technical.
3. **Ondecarrega** ("where it loads"). Ties straight to the location angle, but longer.
4. **Carregômetro** ("load meter"). Descriptive, hard to protect as a trademark.
5. **Triplotempo** ("triple time", the 3 runs). Only makes sense once the 3-run feature ships.

Tradeoff: Quantoleva is Portuguese-only. If you plan for English speakers, choose Veloscópio.

## Checks (screening, not legal clearance)
Run on 2026-11-09 from this machine. "free?" means the registry or API answered "not found", **not** that it is safe to buy or use.

| name | .com (Verisign RDAP) | .com.br (Registro.br RDAP) | GitHub user/org | INPI Brazil | USPTO | EUIPO | WIPO | App Store / Play | X, Instagram, TikTok | web search |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| quantoleva | free? | free? | free? | to run | to run | to run | to run | to run | to run | to run |
| veloscopio | free? | free? | free? | to run | to run | to run | to run | to run | to run | to run |
| ondecarrega | free? | free? | free? | to run | to run | to run | to run | to run | to run | to run |
| carregometro | free? | free? | free? | to run | to run | to run | to run | to run | to run | to run |
| triplotempo | free? | free? | free? | to run | to run | to run | to run | to run | to run | to run |

To run yourself: INPI (busca.inpi.gov.br, classes 9, 42 and 35), USPTO (tmsearch.uspto.gov), EUIPO eSearch, WIPO Global Brand Database, the exact name in the App Store and Google Play, social handles, a web search for "name + teste de velocidade". Before paying for the name, get a trademark lawyer in your country to do a proper search. Domains: register nothing until the trademark search is clean.

## Palette
New brand colour: deep teal `#0b6e69` (white text on it: 6.09:1). The original's brand family is orange/yellow, so this is a different family; the earlier placeholder blue was not the original's either.
To avoid clashes, the waterfall DNS colour moved from teal to olive `#6d7a0a`.
`python3 contrast.py replica/design/tokens.json`: 30 pairs, 0 failing AA.
The original's exact brand hexes were not measured (no reference screenshots), so `brand.json` has no `colors` yet. Add them once you have prints, then re-run the sweep.

## Logo brief
- Idea: a stopwatch hand that fans out into three lines of different length, one per run, for "time, and the range". Keep it flat, teal on white.
- Mark: symbol plus wordmark "Quantoleva" in a rounded sans (Inter or similar open font).
- Must work at 16 px (favicon: the symbol only, drop the fine lines) and as a 1024 px app icon.
- Deliverables: SVG; app icon 1024x1024 without transparency; favicon set; social image 1200x630.
- Must not resemble the original's mark: no shared shape, colour pair or letterform trick. Put the original's logo next to the drafts and check before approving.
- Not done: no logo exists yet, the header shows the name in text only.

## Voice
Three words:
- **Direct, not curt.** Say the number, then what it means.
- **Honest about doubt, not vague.** Say when a result varies; never hide behind "may".
- **Practical, not technical.** Name the file and the fix, skip the jargon.

| do | don't |
| --- | --- |
| "Carregou em 2,1 s." | "Seu desempenho foi calculado com sucesso." |
| "Esse arquivo pesa 1,2 MB. Reduza a imagem." | "Otimize seus ativos." |
| "Não conseguimos abrir essa página." | "Erro 500." |
| "Os tempos mudam de um teste para outro." | "Resultado definitivo." |
| "Tente de novo em alguns minutos." | "Limite de requisições excedido." |

## The 10 most-seen strings (all written fresh, in this voice)
| where | string |
| --- | --- |
| page title | "Quantoleva: Quanto leva para a sua página carregar?" |
| hero | "Quanto leva para a sua página carregar?" |
| hero text | "Cole o endereço e escolha de onde testar. Mostramos o tempo, o peso e cada arquivo que a página pede." |
| main button | "Iniciar teste" |
| invalid URL | "Esse endereço não parece válido. Exemplo: exemplo.com.br" |
| blocked | "Esse endereço não pode ser testado (rede interna ou porta não permitida)." |
| waiting | "Abrindo a página e medindo cada arquivo…" |
| slow wait | "Está demorando mais que o normal. Você pode esperar ou tentar de novo." |
| unreachable | "Não conseguimos abrir essa página. Confira o endereço e se o site está no ar." |
| footer | "Cada teste carrega a página num navegador real, sem cache. Os tempos variam de um teste para outro." |

## Sweep
`python3 sweep.py . --config replica/brand.json`: **clean** (no "Pingdom", "SolarWinds" or their domains outside the `replica/` planning folder, which never ships). Checked by `grep` as well. Not checked: favicon (none yet), OG image (none yet), email templates (none), app icon (none).
The project folder is still called `replica-pingdom`; rename it (and any repository name) before publishing anything.
