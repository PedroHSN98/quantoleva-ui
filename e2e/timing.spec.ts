import { expect, test } from "@playwright/test";
import { evaluateRules } from "../src/lib/grading";
import { buildPlan } from "../src/lib/improvements";
import { idleText } from "../src/lib/timing";
import type { RequestRow } from "../src/lib/types";

test.describe("load time vs idle network (pure logic)", () => {
  test("T1 tests made before idle was measured show no idle tile", () => {
    expect(idleText(undefined, undefined, 1000)).toBeNull();
  });

  test("T2 idle right after load: says so", () => {
    const t = idleText(1500, true, 1000)!;
    expect(t.value).toBe("1.50 s");
    expect(t.hint).toContain("logo depois do load");
  });

  test("T3 idle long after load: shows the gap", () => {
    const t = idleText(6000, true, 1000)!;
    expect(t.value).toBe("6.00 s");
    expect(t.hint).toContain("5.00 s depois do load");
  });

  test("T4 network never went quiet: 'mais de'", () => {
    const t = idleText(11_000, false, 1000)!;
    expect(t.value).toBe("mais de 11.00 s");
    expect(t.hint).toContain("ainda baixava");
  });

  test("T5 the plan explains a big gap between load and idle, and stays quiet when there is none", () => {
    const r: RequestRow = {
      seq: 0, url: "https://s.com/", domain: "s.com", contentType: "html", statusCode: 200, sizeBytes: 50_000,
      startMs: 0, blockedMs: 0, dnsMs: 1, connectMs: 1, sslMs: 1, sendMs: 1, waitMs: 50, receiveMs: 5,
    };
    const rules = evaluateRules([r], 3500, 50_000);
    const withGap = buildPlan(rules, [r], 3500, 50_000, { ms: 9000, reached: true });
    expect(withGap.fixes.find((f) => f.key === "load_time")!.steps.join(" ")).toContain("só parou de baixar arquivos em 9.00 s");
    const noGap = buildPlan(rules, [r], 3500, 50_000, { ms: 3800, reached: true });
    expect(noGap.fixes.find((f) => f.key === "load_time")!.steps.join(" ")).not.toContain("só parou de baixar");
  });
});

test.describe("load time vs idle network (screen)", () => {
  test("T6 the result shows both times as separate tiles", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await page.waitForURL(/\/result\//);
    await expect(page.getByRole("heading", { name: "Resultado" })).toBeVisible();
    await expect(page.locator("p.text-xs", { hasText: /^Tempo de carregamento$/ })).toBeVisible();
    await expect(page.getByText("até o evento de carregamento (load) do navegador")).toBeVisible();
    await expect(page.locator("p.text-xs", { hasText: /^Rede parada$/ })).toBeVisible();
    const idleValue = await page.locator("p.text-xs", { hasText: /^Rede parada$/ }).locator("xpath=following-sibling::p[1]").innerText();
    const loadValue = await page.locator("p.text-xs", { hasText: /^Tempo de carregamento$/ }).locator("xpath=following-sibling::p[1]").innerText();
    const num = (s: string) => Number(s.replace(/[^\d.]/g, ""));
    expect(num(idleValue)).toBeGreaterThanOrEqual(num(loadValue));
  });

  test("T7 the comparison has a column for each time", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Adicionar outro endereço" }).click();
    await page.getByLabel("Outro endereço (2)", { exact: true }).fill("example.org");
    await page.getByRole("button", { name: "Iniciar testes" }).click();
    await page.waitForURL(/\/comparar\?ids=/);
    await expect(page.getByText("Todos os testes terminaram.")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole("columnheader", { name: "Carregou em" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Rede parada" })).toBeVisible();
  });
});
