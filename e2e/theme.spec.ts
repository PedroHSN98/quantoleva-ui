import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { evaluateRules } from "../src/lib/grading";
import type { RequestRow } from "../src/lib/types";

const theme = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.dataset.theme);
const bodyBg = (page: import("@playwright/test").Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe("theme: light is the default when the system has no preference", () => {
  test.use({ colorScheme: "light" });

  test("TH1 toggle switches to dark, changes colors, and the choice survives a reload", async ({ page }) => {
    await page.goto("/");
    expect(await theme(page)).toBe("light");
    const lightBg = await bodyBg(page);

    await page.getByRole("button", { name: "Mudar para o tema escuro" }).click();
    expect(await theme(page)).toBe("dark");
    expect(await bodyBg(page)).not.toBe(lightBg);
    await expect(page.getByRole("button", { name: "Mudar para o tema claro" })).toBeVisible();

    await page.reload();
    expect(await theme(page)).toBe("dark");
    await expect(page.getByRole("button", { name: "Mudar para o tema claro" })).toBeVisible();

    await page.getByRole("button", { name: "Mudar para o tema claro" }).click();
    expect(await theme(page)).toBe("light");
    expect(await bodyBg(page)).toBe(lightBg);
  });

  test("TH2 the toggle works from the keyboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Mudar para o tema escuro" }).focus();
    await page.keyboard.press("Enter");
    expect(await theme(page)).toBe("dark");
  });
});

test.describe("theme: follows the system when nothing was chosen", () => {
  test.use({ colorScheme: "dark" });

  test("TH3 system dark, no saved choice: opens dark, before any click", async ({ page }) => {
    await page.goto("/");
    expect(await theme(page)).toBe("dark");
  });

  test("TH4 a saved choice beats the system preference", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto("/");
    expect(await theme(page)).toBe("light");
  });

  test("TH5 a garbage saved value is ignored", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "<script>"));
    await page.goto("/");
    expect(await theme(page)).toBe("dark");
  });
});

test.describe("theme: dark screens pass the accessibility scan", () => {
  test.use({ colorScheme: "dark" });

  test("TH6 home in dark has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("TH7 result with the plan open, in dark, has no violations", async ({ page }) => {
    const req = (seq: number, over: Partial<RequestRow>): RequestRow => ({
      seq, url: `https://site.com.br/f${seq}`, domain: "site.com.br", contentType: "js", statusCode: 200, sizeBytes: 60_000,
      startMs: seq * 10, blockedMs: 0, dnsMs: 5, connectMs: 10, sslMs: 10, sendMs: 1, waitMs: 100, receiveMs: 20, ...over,
    });
    const requests = [
      req(0, { url: "https://site.com.br/", contentType: "html", waitMs: 900 }),
      ...Array.from({ length: 30 }, (_, i) => req(i + 1, { contentType: "image", url: `https://cdn.outro.com/foto${i}.png`, domain: "cdn.outro.com", sizeBytes: 400_000 })),
      ...Array.from({ length: 50 }, (_, i) => req(i + 31, { url: `https://ads.exemplo.net/s${i}.js`, domain: "ads.exemplo.net" })),
    ];
    const bytes = requests.reduce((s, r) => s + r.sizeBytes, 0);
    const rules = evaluateRules(requests, 4200, bytes);
    const testRow = {
      publicId: "fake-dark-1", url: "https://site.com.br/", locationSlug: "sa-east", status: "done", grade: "E", score: 40,
      loadMs: 4200, idleMs: 6000, idleReached: true, pageBytes: bytes, requestCount: requests.length, docStatus: 200,
      runsDone: 1, runsPlanned: 1, runs: [], createdAt: "2026-11-09T12:00:00.000Z", simulated: false,
    };
    await page.route("**/api/tests/fake-dark-1", (route) => route.fulfill({ json: { test: testRow, rules } }));
    await page.route("**/api/tests/fake-dark-1/requests", (route) => route.fulfill({ json: requests }));

    await page.goto("/result/fake-dark-1");
    expect(await theme(page)).toBe("dark");
    await page.getByRole("button", { name: /Como chegar a 100\/100/ }).click();
    await expect(page.getByRole("heading", { name: "Plano para chegar a 100/100" })).toBeVisible();
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
