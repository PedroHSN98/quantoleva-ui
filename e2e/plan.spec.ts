import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { evaluateRules } from "../src/lib/grading";
import { buildPlan, planText } from "../src/lib/improvements";
import type { RequestRow } from "../src/lib/types";

const MB = 1048576;
const req = (seq: number, over: Partial<RequestRow> = {}): RequestRow => ({
  seq, url: `https://site.com.br/f${seq}.js`, domain: "site.com.br", contentType: "js", statusCode: 200, sizeBytes: 20_000,
  startMs: seq * 10, blockedMs: 0, dnsMs: 5, connectMs: 10, sslMs: 10, sendMs: 1, waitMs: 100, receiveMs: 20, ...over,
});

/** A heavy page: 90 requests, 6 big photos in PNG, 40 scripts on 3 domains. */
function heavy(): RequestRow[] {
  const rs: RequestRow[] = [req(0, { url: "https://site.com.br/", contentType: "html", sizeBytes: 60_000, waitMs: 900 })];
  for (let i = 1; i <= 40; i++) rs.push(req(i, { domain: i % 4 ? "site.com.br" : "ads.exemplo.net", url: `https://${i % 4 ? "site.com.br" : "ads.exemplo.net"}/s${i}.js`, sizeBytes: 60_000 }));
  for (let i = 41; i <= 46; i++) rs.push(req(i, { contentType: "image", url: `https://cdn.outro.com/foto${i}.png`, domain: "cdn.outro.com", sizeBytes: 900_000 }));
  for (let i = 47; i <= 89; i++) rs.push(req(i, { contentType: "css", url: `https://site.com.br/c${i}.css`, sizeBytes: 5_000 }));
  return rs;
}

test.describe("improvement plan (pure logic)", () => {
  const requests = heavy();
  const bytes = requests.reduce((s, r) => s + r.sizeBytes, 0);
  const rules = evaluateRules(requests, 4200, bytes);
  const plan = buildPlan(rules, requests, 4200, bytes);

  test("P1 only rules below 100 appear, biggest gain first", () => {
    expect(plan.fixes.length).toBeGreaterThan(0);
    for (const f of plan.fixes) expect(f.ruleScore).toBeLessThan(100);
    const gains = plan.fixes.map((f) => f.gain);
    expect(gains).toEqual([...gains].sort((a, b) => b - a));
  });

  test("P2 gains add up to the points missing from 100 (within rounding)", () => {
    const total = plan.fixes.reduce((s, f) => s + f.gain, 0);
    expect(Math.abs(total - (100 - plan.score))).toBeLessThanOrEqual(3);
  });

  test("P3 the plan uses the real files: heaviest files, old image formats, third-party domains", () => {
    const weight = plan.fixes.find((f) => f.key === "page_weight")!;
    expect(weight.files[0].bytes).toBe(900_000);
    const images = plan.fixes.find((f) => f.key === "image_weight")!;
    expect(images.steps.join(" ")).toContain("PNG, JPG ou GIF");
    expect(images.steps.join(" ")).toContain("WebP");
    const scripts = plan.fixes.find((f) => f.key === "blocking_scripts")!;
    expect(scripts.steps.join(" ")).toContain("ads.exemplo.net");
    expect(scripts.files.some((x) => x.note?.includes("seu site"))).toBe(true);
  });

  test("P4 a slow server is called out; a fast one is not", () => {
    const slow = plan.fixes.find((f) => f.key === "load_time")!;
    expect(slow.steps[0]).toContain("926 ms"); // 5 dns + 10 connect + 10 ssl + 1 send + 900 wait
    const fast = buildPlan(evaluateRules(requests, 4200, bytes), requests.map((r, i) => (i === 0 ? { ...r, waitMs: 50 } : r)), 4200, bytes);
    expect(fast.fixes.find((f) => f.key === "load_time")!.steps[0]).toContain("o que é bom");
  });

  test("P5 a lean page has nothing to improve", () => {
    const lean = [req(0, { url: "https://site.com.br/", contentType: "html", sizeBytes: 3000 })];
    const p = buildPlan(evaluateRules(lean, 600, 3000), lean, 600, 3000);
    expect(p.fixes).toEqual([]);
    expect(p.score).toBe(100);
    expect(planText("https://site.com.br/", p)).toContain("Nada a melhorar");
  });

  test("P6 the text file lists every item with goal and steps", () => {
    const text = planText("https://site.com.br/", plan, new Date("2026-11-09T12:00:00Z"));
    expect(text).toContain("PLANO PARA CHEGAR A 100/100");
    expect(text).toContain("Endereço testado: https://site.com.br/");
    for (const f of plan.fixes) {
      expect(text).toContain(f.title.toUpperCase());
      expect(text).toContain(`Meta: ${f.target}`);
    }
    expect(text).toContain("   - ");
  });
});

test.describe("improvement plan (screen)", () => {
  const requests = heavy();
  const bytes = requests.reduce((s, r) => s + r.sizeBytes, 0);
  const rules = evaluateRules(requests, 4200, bytes);

  test("P7 the button shows the plan on screen and downloads it as a text file", async ({ page }) => {
    const testRow = {
      publicId: "fake-plan-1", url: "https://site.com.br/", locationSlug: "sa-east", status: "done", grade: "E", score: 51,
      loadMs: 4200, pageBytes: bytes, requestCount: requests.length, docStatus: 200, runsDone: 1, runsPlanned: 1, runs: [],
      createdAt: "2026-11-09T12:00:00.000Z", simulated: false,
    };
    await page.route("**/api/tests/fake-plan-1", (route) => route.fulfill({ json: { test: testRow, rules } }));
    await page.route("**/api/tests/fake-plan-1/requests", (route) => route.fulfill({ json: requests }));

    await page.goto("/result/fake-plan-1");
    const open = page.getByRole("button", { name: /Como chegar a 100\/100/ });
    await expect(open).toBeEnabled();
    await expect(page.getByRole("heading", { name: "Plano para chegar a 100/100" })).toHaveCount(0);

    await open.click();
    await expect(open).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("heading", { name: "Plano para chegar a 100/100" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Peso total da página", level: 4 })).toBeVisible();
    await expect(page.getByText(/até \+\d+ pontos/).first()).toBeVisible();
    const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(a11y.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

    await open.click(); // hides again
    await expect(page.getByRole("heading", { name: "Plano para chegar a 100/100" })).toHaveCount(0);

    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Baixar plano de melhorias" }).click()]);
    expect(download.suggestedFilename()).toMatch(/^plano-site\.com\.br-\d{4}-\d\d-\d\d\.txt$/);
    const text = readFileSync(await download.path(), "utf8");
    expect(text).toContain("PLANO PARA CHEGAR A 100/100");
    expect(text).toContain("PESO TOTAL DA PÁGINA");
  });

  test("P8 a real lean page says there is nothing to improve", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await page.waitForURL(/\/result\//);
    const open = page.getByRole("button", { name: /Como chegar a 100\/100/ });
    await expect(open).toBeEnabled({ timeout: 60_000 });
    await open.click();
    await expect(page.getByText("não há o que melhorar")).toBeVisible();
  });
});
