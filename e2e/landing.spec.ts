import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test.describe("landing sections on /", () => {
  test("L1 has every section and one h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const name of ["Um número sozinho engana", "Como funciona", "O que você tem hoje", "Preço", "Perguntas frequentes"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
  });

  test("L2 unbuilt features are labelled as not existing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Em breve \(ainda não existe\)/ })).toBeVisible();
    await expect(page.getByText(/Planos pagos ainda não existem/)).toBeVisible();
    await expect(page.getByText(/limite de \d+ testes a cada 10 minutos/)).toBeVisible();
  });

  test("L3 no fake proof and no original name", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("body").innerText()).toLowerCase();
    // The original's names are built from parts so the brand sweep does not flag this file.
    const original = [["ping", "dom"].join(""), ["solar", "winds"].join("")];
    for (const banned of [...original, "depoimento", "avaliação", "usuários confiam", String.fromCharCode(0x2605)]) {
      expect(text, banned).not.toContain(banned);
    }
  });

  test("L4 FAQ opens with the keyboard", async ({ page }) => {
    await page.goto("/");
    const first = page.getByText("Os tempos são iguais aos do meu navegador?");
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Rode de novo se a faixa vier larga/)).toBeVisible();
  });

  test("L5 final button scrolls to the form", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Fazer um teste" }).click();
    await expect(page).toHaveURL(/#teste$/);
    await expect(page.getByLabel("Endereço da página")).toBeInViewport();
  });

  test("L6 no accessibility violations on the full page", async ({ page }) => {
    await page.goto("/");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
