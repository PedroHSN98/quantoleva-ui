import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { batchCsv, cell, resultCsv } from "../src/lib/export-csv";
import type { RequestRow, TestRow } from "../src/lib/types";

const base: TestRow = {
  publicId: "abc", url: "https://exemplo.com.br/", locationSlug: "sa-east", status: "done", grade: "B", score: 82,
  loadMs: 1234, idleMs: 3100, idleReached: true, pageBytes: 2 * 1048576, requestCount: 1, docStatus: 200, runsDone: 1, runsPlanned: 1, runs: [],
  createdAt: "2026-11-09T12:00:00.000Z", simulated: false,
};
const req = (over: Partial<RequestRow> = {}): RequestRow => ({
  seq: 0, url: "https://exemplo.com.br/", domain: "exemplo.com.br", contentType: "html", statusCode: 200, sizeBytes: 2048,
  startMs: 0, blockedMs: 1, dnsMs: 2, connectMs: 3, sslMs: 4, sendMs: 5, waitMs: 6, receiveMs: 7, ...over,
});

test.describe("report file (pure logic)", () => {
  test("D1 cells are quoted and quotes doubled", () => {
    expect(cell('a "b" c')).toBe('"a ""b"" c"');
    expect(cell(12)).toBe('"12"');
    expect(cell(undefined)).toBe('""');
  });

  test("D2 a text starting with = + - @ cannot run as a spreadsheet formula", () => {
    for (const s of ["=1+1", "+cmd", "-2", "@SUM(A1)"]) expect(cell(s)).toBe(`"'${s}"`);
    expect(cell(-5)).toBe('"-5"'); // real negative numbers stay numbers
  });

  test("D3 the file has summary, rules and one line per file, with sizes in bytes and KB", () => {
    const csv = resultCsv(base, [{ key: "page_weight", name: "Peso total da página", score: 70, advice: "Reduza." }], [req(), req({ seq: 1, url: "https://exemplo.com.br/a.js", contentType: "js", sizeBytes: 1536 })]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"Endereço testado";"https://exemplo.com.br/"');
    expect(csv).toContain('"Tempo até o evento de carregamento / load (ms)";"1234"');
    expect(csv).toContain('"Tempo até a rede parar (ms)";"3100"');
    expect(csv).toContain('"A rede chegou a parar?";"sim"');
    expect(csv).toContain('"Primeira resposta do servidor (ms)";"20"'); // 2+3+4+5+6
    expect(csv).toContain('"Peso total da página";"70";"Reduza."');
    expect(csv).toContain('"2";"https://exemplo.com.br/a.js";"exemplo.com.br";"js";"200";"1536";"1,50"');
    expect(csv.match(/\r\n/g)!.length).toBeGreaterThan(10);
  });

  test("D4 a blocked page is exported without a grade, with the warning", () => {
    const csv = resultCsv({ ...base, docStatus: 403 }, [{ key: "x", name: "Regra", score: 100, advice: "" }], [req({ statusCode: 403 })]);
    expect(csv).toContain('"Nota";"sem nota"');
    expect(csv).toContain("Site bloqueou o teste (403)");
    expect(csv).not.toContain("REGRAS DA NOTA");
  });

  test("D5 the comparison has one line per address and skips missing tests", () => {
    const csv = batchCsv([base, null, { ...base, publicId: "x2", url: "https://b.com/", status: "failed", errorCode: "unreachable" }], "http://localhost:3100");
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"pronto"');
    expect(lines[1]).toContain("http://localhost:3100/result/abc");
    expect(lines[2]).toContain("falhou (unreachable)");
  });
});

test.describe("download buttons", () => {
  test("D6 the result page downloads a CSV with the real files", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await page.waitForURL(/\/result\//);
    const button = page.getByRole("button", { name: "Baixar relatório (CSV)" });
    await expect(button).toBeEnabled({ timeout: 60_000 });
    const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
    expect(download.suggestedFilename()).toMatch(/^example\.com-\d{4}-\d\d-\d\d\.csv$/);
    const text = readFileSync(await download.path(), "utf8");
    expect(text).toContain("Endereço testado");
    expect(text).toContain("ARQUIVOS PEDIDOS PELA PÁGINA");
    expect(text).toMatch(/"https:\/\/example\.com\/?"/);
    expect(text).toContain('"Nota";"A"');
  });

  test("D7 the comparison page downloads a CSV with one line per address", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("example.com");
    await page.getByRole("button", { name: "Adicionar outro endereço" }).click();
    await page.getByLabel("Outro endereço (2)", { exact: true }).fill("example.org");
    await page.getByRole("button", { name: "Iniciar testes" }).click();
    await page.waitForURL(/\/comparar\?ids=/);
    const button = page.getByRole("button", { name: "Baixar comparação (CSV)" });
    await expect(button).toBeVisible({ timeout: 90_000 });
    const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
    const text = readFileSync(await download.path(), "utf8");
    expect(text.trim().split("\r\n")).toHaveLength(3);
    expect(text).toContain("example.com");
    expect(text).toContain("example.org");
  });
});
