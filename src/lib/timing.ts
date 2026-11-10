// Two different times, shown side by side so they are never confused:
//  - load: until the browser's "load" event (the page is usable)
//  - idle: until the page stopped downloading files (ads, trackers and lazy files arrive after load)
const secs = (ms: number) => `${(ms / 1000).toFixed(2)} s`; // same format as the other tiles

export const LOAD_HINT = "até o evento de carregamento (load) do navegador";

/** Text for the "network idle" tile. null when the test was made before this was measured. */
export function idleText(idleMs?: number, idleReached?: boolean, loadMs?: number): { value: string; hint: string } | null {
  if (idleMs === undefined) return null;
  const gap = loadMs === undefined ? 0 : Math.max(0, idleMs - loadMs);
  if (idleReached === false) {
    return { value: `mais de ${secs(idleMs)}`, hint: "a página ainda baixava arquivos quando paramos de esperar (10 s depois do load)" };
  }
  if (gap < 700) return { value: secs(idleMs), hint: "a página parou de baixar arquivos logo depois do load" };
  return { value: secs(idleMs), hint: `${secs(gap)} depois do load a página ainda baixava arquivos (inclui 0,5 s de silêncio que o navegador espera)` };
}
