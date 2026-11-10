import { expect, test } from "@playwright/test";
import { shortUrl } from "../src/lib/short-url";

test.describe("short file label (pure logic)", () => {
  test("U1 a short address is shown whole, without the protocol", () => {
    expect(shortUrl("https://example.com/")).toBe("example.com/");
    expect(shortUrl("https://site.com.br/a.css")).toBe("site.com.br/a.css");
  });

  test("U2 a deep path keeps the host and the file name", () => {
    expect(shortUrl("https://cdn.site.com/uploads/2026/11/09/banners/principal/foto-grande-do-banner-principal.jpg")).toBe("cdn.site.com/…/foto-grande-do-banner-principal.jpg");
    // short enough: shown whole
    expect(shortUrl("https://cdn.site.com/uploads/2026/11/foto.jpg")).toBe("cdn.site.com/uploads/2026/11/foto.jpg");
  });

  test("U3 when the last segments are generic, it reaches back to the one that names the file", () => {
    const u = "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/carrossel/simples-nacional-2027-entenda-os-novos-prazos/@@images/image";
    const s = shortUrl(u);
    expect(s.startsWith("www.gov.br/…/")).toBe(true);
    expect(s.endsWith("/@@images/image")).toBe(true);
    expect(s).toContain("prazos");
    expect(s.length).toBeLessThanOrEqual(64 + 2);
  });

  test("U4 two files that differ only near the end get different labels", () => {
    const base = "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/carrossel/";
    expect(shortUrl(`${base}noticia-um-com-nome-longo/@@images/image`)).not.toBe(shortUrl(`${base}noticia-dois-com-nome-longo/@@images/image`));
  });

  test("U5 a query string is marked when it is the only difference, and ignored after a file name", () => {
    expect(shortUrl("https://s.com/api/dados?id=1")).toBe("s.com/api/dados?…");
    expect(shortUrl("https://s.com/x/y/z/w/v/u/t/foto.png?v=9&x=10")).toBe("s.com/…/foto.png");
  });

  test("U6 percent-encoding is decoded for reading, and bad encoding does not throw", () => {
    expect(shortUrl("https://s.com/aaaaaaaaaa/bbbbbbbbbb/cccccccccc/dddddddddd/eeeeeeeeee/Foto%20da%20Capa.jpg")).toBe("s.com/…/Foto da Capa.jpg");
    expect(() => shortUrl("https://s.com/a/b/c/d/e/f/g/%E0%A4%A.jpg")).not.toThrow();
  });

  test("U7 not a URL: truncated, never throws", () => {
    expect(shortUrl("não é um endereço")).toBe("não é um endereço");
    expect(shortUrl("x".repeat(200)).length).toBe(64);
  });
});
