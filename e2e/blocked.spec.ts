import { expect, test } from "@playwright/test";
import { blockNotice } from "../src/lib/block-notice";
import { alertBox } from "./fixtures";

test.describe("block notice (pure logic)", () => {
  test("K1 no notice for a normal page or a missing status", () => {
    expect(blockNotice(undefined)).toBeNull();
    expect(blockNotice(200)).toBeNull();
    expect(blockNotice(304)).toBeNull();
  });

  test("K2 403, 401, 429 say the site blocked the test", () => {
    for (const s of [401, 403, 429]) {
      const n = blockNotice(s)!;
      expect(n.short).toContain("bloqueou");
      expect(n.short).toContain(String(s));
      expect(n.long).toContain("a nota não vale");
    }
  });

  test("K3 404 says the page does not exist, 5xx says the site failed", () => {
    expect(blockNotice(404)!.short).toContain("não encontrada");
    expect(blockNotice(503)!.short).toContain("Erro no site");
  });
});

test.describe("block notice (screens)", () => {
  test("K4 a 404 page gets a warning and no grade, on the result and the comparison", async ({ page, request }) => {
    const r = await request.post("/api/tests", { data: { urls: ["https://example.com/nao-existe-xyz-123", "example.org"] } });
    expect(r.status()).toBe(201);
    const ids: string[] = (await r.json()).publicIds;
    await page.goto(`/comparar?ids=${ids.join(",")}`);
    await expect(page.getByText("Todos os testes terminaram.")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText("Página não encontrada (404)")).toBeVisible();
    await expect(page.getByText("Pronto")).toHaveCount(1); // only the normal page

    await page.goto(`/result/${ids[0]}`);
    await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
    await expect(page.getByText("essa página não existe")).toBeVisible();
    await expect(page.getByText("sem nota")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como melhorar" })).toHaveCount(0);
    await expect(alertBox(page)).toHaveCount(0);
  });

  test("K5 a normal page keeps its grade and has no warning", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await page.waitForURL(/\/result\//);
    await expect(page.getByRole("heading", { name: "Como melhorar" })).toBeVisible();
    await expect(page.getByText("sem nota")).toHaveCount(0);
  });
});
