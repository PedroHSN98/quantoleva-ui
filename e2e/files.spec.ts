import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { evaluateRules } from "../src/lib/grading";
import type { ContentType, RequestRow } from "../src/lib/types";

const KB = 1024;
let seq = 0;
const req = (type: ContentType, name: string, bytes: number, startMs: number, waitMs = 50): RequestRow => ({
  seq: seq++, url: `https://site.com.br/${name}`, domain: "site.com.br", contentType: type, statusCode: 200, sizeBytes: bytes,
  startMs, blockedMs: 0, dnsMs: 0, connectMs: 0, sslMs: 0, sendMs: 1, waitMs, receiveMs: 10,
});

// 13 files: 1 html, 4 js, 2 css, 5 images (different sizes), 1 font
const FILES: RequestRow[] = [
  req("html", "index.html", 40 * KB, 0),
  req("css", "a.css", 30 * KB, 60),
  req("css", "b.css", 20 * KB, 62),
  req("js", "app.js", 300 * KB, 70, 200),
  req("js", "vendor.js", 500 * KB, 71),
  req("js", "extra.js", 10 * KB, 75),
  req("js", "tag.js", 5 * KB, 80),
  req("image", "img/pequena.png", 20 * KB, 90),
  req("image", "img/foto-grande.jpg", 1200 * KB, 95, 80),
  req("image", "img/media.jpg", 300 * KB, 96),
  req("image", "img/icone.svg", 2 * KB, 97),
  req("image", "img/banner.png", 700 * KB, 98),
  req("font", "fonte.woff2", 90 * KB, 100),
];

test.beforeEach(async ({ page }) => {
  const bytes = FILES.reduce((s, r) => s + r.sizeBytes, 0);
  const rules = evaluateRules(FILES, 1500, bytes);
  const testRow = {
    publicId: "fake-files-1", url: "https://site.com.br/", locationSlug: "sa-east", status: "done", grade: "B", score: 80,
    loadMs: 1500, idleMs: 2200, idleReached: true, pageBytes: bytes, requestCount: FILES.length, docStatus: 200,
    runsDone: 1, runsPlanned: 1, runs: [], createdAt: "2026-11-09T12:00:00.000Z", simulated: false,
  };
  await page.route("**/api/tests/fake-files-1", (route) => route.fulfill({ json: { test: testRow, rules } }));
  await page.route("**/api/tests/fake-files-1/requests", (route) => route.fulfill({ json: FILES }));
  await page.goto("/result/fake-files-1");
  await expect(page.getByRole("heading", { name: "Arquivos pedidos", exact: true })).toBeVisible();
});

const table = (page: import("@playwright/test").Page) => page.getByRole("table", { name: /Arquivos pedidos pela página/ });
const rows = (page: import("@playwright/test").Page) => table(page).locator("tbody > tr");
const typeButton = (page: import("@playwright/test").Page, name: RegExp | string) =>
  page.getByRole("group", { name: "Filtrar por tipo de arquivo" }).getByRole("button", { name });

test.describe("Arquivos pedidos: filter by type", () => {
  test("FX1 the filter lists only the types that exist, with their counts", async ({ page }) => {
    await expect(typeButton(page, /^Todos 13/)).toHaveAttribute("aria-pressed", "true");
    for (const [label, n] of [["Imagem", 5], ["JavaScript", 4], ["CSS", 2], ["HTML", 1], ["Fonte", 1]] as const) {
      await expect(typeButton(page, new RegExp(`^${label} ${n}`))).toBeVisible();
    }
    await expect(typeButton(page, /^Texto/)).toHaveCount(0);
    await expect(typeButton(page, /^Outro/)).toHaveCount(0);
    await expect(rows(page)).toHaveCount(13);
  });

  test("FX2 Imagem shows only images", async ({ page }) => {
    await typeButton(page, /^Imagem/).click();
    await expect(typeButton(page, /^Imagem/)).toHaveAttribute("aria-pressed", "true");
    await expect(typeButton(page, /^Todos/)).toHaveAttribute("aria-pressed", "false");
    await expect(rows(page)).toHaveCount(5);
    await expect(rows(page).filter({ hasNotText: "Imagem" })).toHaveCount(0);
    await expect(page.getByText(/Mostrando 5 de 13 arquivos: Imagem, /)).toBeVisible();
  });

  test("FX3 JavaScript, CSS and HTML each show only their own files", async ({ page }) => {
    for (const [label, n] of [["JavaScript", 4], ["CSS", 2], ["HTML", 1]] as const) {
      await typeButton(page, new RegExp(`^${label}`)).click();
      await expect(rows(page)).toHaveCount(n);
      await expect(rows(page).filter({ hasNotText: label })).toHaveCount(0);
    }
  });

  test("FX4 'Todos' brings everything back", async ({ page }) => {
    await typeButton(page, /^CSS/).click();
    await expect(rows(page)).toHaveCount(2);
    await typeButton(page, /^Todos/).click();
    await expect(rows(page)).toHaveCount(13);
    await expect(page.getByText("13 arquivos, ")).toBeVisible();
  });

  test("FX5 the summary gives the share of the page weight for the chosen type", async ({ page }) => {
    // images: 20 + 1200 + 300 + 2 + 700 = 2222 KB of 3219 KB total = 69%
    await typeButton(page, /^Imagem/).click();
    await expect(page.getByText(/\(69% do peso da página\)/)).toBeVisible();
  });

  test("FX6 the timeline keeps the whole page scale after filtering", async ({ page }) => {
    const header = table(page).getByRole("columnheader", { name: /Linha do tempo/ });
    const before = await header.innerText();
    await typeButton(page, /^Fonte/).click();
    await expect(rows(page)).toHaveCount(1);
    expect(await header.innerText()).toBe(before);
  });

  test("FX7 the filter works with the keyboard", async ({ page }) => {
    await typeButton(page, /^JavaScript/).focus();
    await page.keyboard.press("Enter");
    await expect(rows(page)).toHaveCount(4);
  });
});

test.describe("Arquivos pedidos: heaviest first", () => {
  test("FX8 images sorted by size: the heaviest image comes first", async ({ page }) => {
    await typeButton(page, /^Imagem/).click();
    await page.getByLabel("Ordenar por").selectOption("size-desc");
    const order = await rows(page).locator("button span.font-mono").allInnerTexts();
    expect(order.map((u) => u.split("/").pop())).toEqual(["foto-grande.jpg", "banner.png", "media.jpg", "pequena.png", "icone.svg"]);
    await expect(page.getByText(/O mais pesado tem 1\.17 MB/)).toBeVisible();
  });

  test("FX9 smallest first reverses it, and the default is load order", async ({ page }) => {
    await typeButton(page, /^Imagem/).click();
    const names = async () => (await rows(page).locator("button span.font-mono").allInnerTexts()).map((u) => u.split("/").pop());
    expect((await names())[0]).toBe("pequena.png"); // load order
    await page.getByLabel("Ordenar por").selectOption("size-asc");
    expect((await names())[0]).toBe("icone.svg");
  });

  test("FX10 sorting all files by size puts the biggest file of the page on top", async ({ page }) => {
    await page.getByLabel("Ordenar por").selectOption("size-desc");
    const first = (await rows(page).locator("button span.font-mono").allInnerTexts())[0];
    expect(first).toContain("foto-grande.jpg");
  });

  test("FX11 slowest first uses the time each file took", async ({ page }) => {
    await page.getByLabel("Ordenar por").selectOption("slow");
    const first = (await rows(page).locator("button span.font-mono").allInnerTexts())[0];
    expect(first).toContain("app.js"); // wait 200 ms: the slowest
  });
});

test.describe("Arquivos pedidos: accessibility", () => {
  test("FX12 no WCAG A/AA violations with a filter on", async ({ page }) => {
    await typeButton(page, /^Imagem/).click();
    await page.getByLabel("Ordenar por").selectOption("size-desc");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
