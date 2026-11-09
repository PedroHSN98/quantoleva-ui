import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { alertBox, expect, test } from "./fixtures";

async function runTest(page: import("@playwright/test").Page, url: string) {
  await page.goto("/");
  await page.getByLabel("Endereço da página").fill(url);
  await page.getByRole("button", { name: "Iniciar teste" }).click();
  await page.waitForURL(/\/result\//);
}

test.describe("F01 run a test, F02 inspect a file, F04 share", () => {
  test("F01-H1 happy path: example.com gives a graded report", async ({ page }, info) => {
    await runTest(page, "example.com");
    await expect(page.getByRole("status")).toBeVisible(); // progress
    await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
    await expect(page.getByText("Nota de desempenho")).toBeVisible();
    await expect(page.getByText("Tempo de carregamento").first()).toBeVisible();
    await expect(page.getByText("Resultado simulado")).toHaveCount(0);
    await expect(page.getByText(/simulados/)).toHaveCount(0); // stale footer copy (B03)
    await expect(page.getByText(/^\d+(\.\d+)? KB$/).first()).toBeVisible(); // small page shows KB, not 0.00 MB (B04)
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("row")).not.toHaveCount(1);

    mkdirSync("replica/clone-screens", { recursive: true });
    await page.screenshot({ path: `replica/clone-screens/S03-${info.project.name}.png`, fullPage: true });
  });

  test("F01-A2 no accessibility violations on result", async ({ page }) => {
    await runTest(page, "example.com");
    await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("F02-H1 expanding a file row shows the phase timings", async ({ page }) => {
    await runTest(page, "example.com");
    await expect(page.getByRole("table")).toBeVisible();
    const toggle = page.getByRole("button", { expanded: false }).first();
    await toggle.click();
    await expect(page.getByText("Recebimento").first()).toBeVisible();
    await expect(page.getByRole("button", { expanded: true })).toHaveCount(1);
  });

  test("F01-E3 double click on submit creates one test", async ({ page }) => {
    let posts = 0;
    page.on("request", (r) => { if (r.method() === "POST" && r.url().endsWith("/api/tests")) posts++; });
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Iniciar teste" }).dblclick();
    await page.waitForURL(/\/result\//);
    expect(posts).toBe(1);
  });

  test("F01-E4 refresh mid-test keeps the test", async ({ page }) => {
    await runTest(page, "example.com");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
  });

  test("F04-H1 permalink opens the same result in a new tab", async ({ page, context }) => {
    await runTest(page, "example.com");
    await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
    const other = await context.newPage();
    await other.goto(page.url());
    await expect(other.getByRole("heading", { name: "Resultado" })).toBeVisible();
    await expect(other.getByText("example.com").first()).toBeVisible();
  });

  test("F01-N3 unknown domain shows an unreachable error", async ({ page }) => {
    await runTest(page, "https://nao-existe-xyz-12345.com");
    await expect(alertBox(page)).toContainText("Não conseguimos abrir");
  });

  test("F01-N4 hostname resolving to a private IP is blocked", async ({ page }) => {
    await runTest(page, "http://localtest.me");
    await expect(alertBox(page)).toContainText("não pode ser testado");
  });

  test("F01-N5 unknown result id shows not found", async ({ page }) => {
    await page.goto("/result/does-not-exist");
    await expect(page.getByRole("heading", { name: "Teste não encontrado" })).toBeVisible();
  });
});
