/**
 * When the main page itself answers with an error, everything measured is the error page,
 * not the site. A grade for it would be meaningless (a tiny 403 page scores 100), so we warn instead.
 */
export type BlockNotice = { short: string; long: string };

export function blockNotice(status?: number): BlockNotice | null {
  if (!status || status < 400) return null;
  if (status === 404 || status === 410) {
    return {
      short: `Página não encontrada (${status})`,
      long: `O endereço respondeu ${status}: essa página não existe. O que aparece abaixo é só a página de erro. Confira o endereço.`,
    };
  }
  if (status >= 500) {
    return {
      short: `Erro no site (${status})`,
      long: `O servidor do site respondeu com erro ${status}. O que aparece abaixo é só a página de erro, não o site de verdade. Tente de novo mais tarde.`,
    };
  }
  return {
    short: `Site bloqueou o teste (${status})`,
    long: `O site respondeu com erro ${status} à página principal. Provavelmente ele bloqueia programas automáticos ou acessos de fora do país. O que aparece abaixo é só a página de bloqueio, não o site de verdade, então a nota não vale.`,
  };
}
