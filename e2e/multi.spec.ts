import AxeBuilder from "@axe-core/playwright";
import { alertBox, expect, test } from "./fixtures";

type Api = import("@playwright/test").APIRequestContext;

async function waitDone(request: Api, id: string) {
  await expect
    .poll(async () => (await (await request.get(`/api/tests/${id}`)).json()).test.status, { timeout: 90_000, intervals: [1000] })
    .toMatch(/done|failed/);
  return (await (await request.get(`/api/tests/${id}`)).json()).test as {
    status: string; startedAt?: string; finishedAt?: string; url: string;
  };
}

test.describe("API: several addresses per submit", () => {
  test("B-API1 a bad line is rejected with its index, nothing is half-created", async ({ request }) => {
    const r = await request.post("/api/tests", { data: { urls: ["example.com", "isto nao e um endereco", "example.org"] } });
    expect(r.status()).toBe(400);
    expect(await r.json()).toMatchObject({ error: "invalid_url", index: 1 });
  });

  test("B-API2 a private address in the list is blocked with its index", async ({ request }) => {
    const r = await request.post("/api/tests", { data: { urls: ["example.com", "http://127.0.0.1"] } });
    expect(r.status()).toBe(400);
    expect(await r.json()).toMatchObject({ error: "blocked_target", index: 1 });
  });

  test("B-API3 more than 5 addresses is refused", async ({ request }) => {
    const urls = ["a", "b", "c", "d", "e", "f"].map((s) => `${s}.example.com`);
    const r = await request.post("/api/tests", { data: { urls } });
    expect(r.status()).toBe(400);
    expect(await r.json()).toMatchObject({ error: "too_many_urls", max: 5 });
  });

  test("B-API4 duplicates collapse to one test", async ({ request }) => {
    const r = await request.post("/api/tests", { data: { urls: ["example.com", "https://example.com", "example.com/"] } });
    expect(r.status()).toBe(201);
    expect((await r.json()).publicIds).toHaveLength(1);
  });

  test("B-API5 the old single-url body still answers publicId", async ({ request }) => {
    const r = await request.post("/api/tests", { data: { url: "example.com" } });
    expect(r.status()).toBe(201);
    expect(typeof (await r.json()).publicId).toBe("string");
  });
});

test.describe("tests run at the same time", () => {
  test("B-CONC1 three tests overlap: all started before any finished", async ({ request }) => {
    // Earlier specs may have left tests running; they would take worker slots and hide the overlap.
    await expect
      .poll(async () => {
        const s = await (await request.get("/api/status")).json();
        return s.queued + s.running;
      }, { timeout: 90_000, intervals: [1000] })
      .toBe(0);
    const r = await request.post("/api/tests", { data: { urls: ["example.com", "example.org", "example.net"] } });
    expect(r.status()).toBe(201);
    const ids: string[] = (await r.json()).publicIds;
    expect(ids).toHaveLength(3);
    const done = await Promise.all(ids.map((id) => waitDone(request, id)));
    for (const t of done) {
      expect(t.status, t.url).toBe("done");
      expect(t.startedAt, t.url).toBeTruthy();
    }
    const latestStart = Math.max(...done.map((t) => Date.parse(t.startedAt!)));
    const earliestFinish = Math.min(...done.map((t) => Date.parse(t.finishedAt!)));
    // sequential processing would start the 3rd test only after the 1st finished
    expect(latestStart).toBeLessThan(earliestFinish);
  });
});

test.describe("form with several addresses", () => {
  test("B-FORM1 add and remove address fields, up to 5", async ({ page }) => {
    await page.goto("/");
    const add = page.getByRole("button", { name: "Adicionar outro endereço" });
    for (let i = 0; i < 4; i++) await add.click();
    await expect(page.locator('input[type="url"]')).toHaveCount(5);
    await expect(add).toHaveCount(0); // limit reached
    await page.getByRole("button", { name: /Remover outro endereço \(5\)/ }).click();
    await expect(page.locator('input[type="url"]')).toHaveCount(4);
    await expect(add).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar testes" })).toBeVisible();
  });

  test("B-FORM2 the error names the line that is wrong", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Adicionar outro endereço" }).click();
    await page.getByLabel("Outro endereço (2)", { exact: true }).fill("isto nao e um endereco");
    await page.getByRole("button", { name: "Iniciar testes" }).click();
    await expect(alertBox(page)).toContainText("Outro endereço (2): Esse endereço não parece válido");
  });

  test("B-FORM3 empty extra rows are ignored: one address goes to the normal result page", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Adicionar outro endereço" }).click();
    await page.getByRole("button", { name: "Iniciar testes" }).click();
    await page.waitForURL(/\/result\//);
  });
});

test.describe("comparison page", () => {
  test("B-CMP1 two addresses: one row each, both finish, details link works", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Adicionar outro endereço" }).click();
    await page.getByLabel("Outro endereço (2)", { exact: true }).fill("example.org");
    await page.getByRole("button", { name: "Iniciar testes" }).click();
    await page.waitForURL(/\/comparar\?ids=/);

    await expect(page.getByRole("heading", { name: "Comparação de 2 endereços" })).toBeVisible();
    const rows = page.getByRole("table", { name: /Resultado de cada endereço/ }).locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(page.getByText("Todos os testes terminaram.")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText("Pronto")).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Testar outros endereços" })).toBeVisible();

    const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(a11y.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

    await page.getByRole("link", { name: "Ver detalhes" }).first().click();
    await page.waitForURL(/\/result\//);
    await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
  });

  test("B-CMP2 a failing address does not hide the others", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Adicionar outro endereço" }).click();
    await page.getByLabel("Outro endereço (2)", { exact: true }).fill("https://nao-existe-xyz-12345.com");
    await page.getByRole("button", { name: "Iniciar testes" }).click();
    await page.waitForURL(/\/comparar\?ids=/);
    await expect(page.getByText("Todos os testes terminaram.")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText("Pronto")).toHaveCount(1);
    await expect(page.getByText("Não conseguimos abrir")).toBeVisible();
  });

  test("B-CMP3 missing or garbage ids show a friendly page", async ({ page }) => {
    await page.goto("/comparar");
    await expect(page.getByRole("heading", { name: "Nenhum teste para comparar" })).toBeVisible();
    await page.goto("/comparar?ids=%3Cscript%3E,..");
    await expect(page.getByRole("heading", { name: "Nenhum teste para comparar" })).toBeVisible();
  });
});

test.describe("after a result: test another address", () => {
  test("B-NEXT1 the button goes back to an empty form", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await page.waitForURL(/\/result\//);
    await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
    await page.getByRole("link", { name: "Testar outro endereço" }).first().click();
    await expect(page).toHaveURL(/\/#teste$/);
    await expect(page.getByLabel("Endereço da página")).toBeVisible();
    await expect(page.getByLabel("Endereço da página")).toHaveValue("");
  });

  test("B-NEXT2 first-response tile is shown on the result", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await page.waitForURL(/\/result\//);
    await expect(page.getByText("Primeira resposta do servidor")).toBeVisible();
    await expect(page.getByText(/^\d+ ms$/).first()).toBeVisible();
  });
});
