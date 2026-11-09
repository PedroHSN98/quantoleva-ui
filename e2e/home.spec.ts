import AxeBuilder from "@axe-core/playwright";
import { alertBox, expect, test } from "./fixtures";

test.describe("S01 home form", () => {
  test("F01-H0 home renders with labelled fields", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel("Endereço da página")).toBeVisible();
    await expect(page.getByLabel("Testar a partir de")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar teste" })).toBeVisible();
  });

  test("F01-A1 no accessibility violations on home", async ({ page }) => {
    await page.goto("/");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("F01-E1 empty input shows an error", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await expect(alertBox(page)).toContainText("não parece válido");
  });

  test("F01-E2 garbage input shows an error", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("isto não é um endereço");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await expect(alertBox(page)).toContainText("não parece válido");
  });

  test("F01-N1 private address is refused", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("http://127.0.0.1");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await expect(alertBox(page)).toContainText("não pode ser testado");
  });

  test("F01-N2 non-web scheme is refused", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").fill("file:///etc/passwd");
    await page.getByRole("button", { name: "Iniciar teste" }).click();
    await expect(alertBox(page)).toBeVisible();
  });

  test("F01-E5 keyboard only can submit", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Endereço da página").focus();
    await page.keyboard.type("http://localhost:1");
    await page.keyboard.press("Enter");
    await expect(alertBox(page)).toContainText("não pode ser testado");
  });

  test("F01-E6 no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
