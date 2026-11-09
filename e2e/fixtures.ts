import { test as base, expect, type Page } from "@playwright/test";

/** Every test fails on console errors and on any 5xx response.
 *  4xx responses are expected (validation errors, not-found); the browser logs them as console errors. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" && !/Failed to load resource.*status of 4\d\d/.test(m.text())) problems.push(`console: ${m.text()}`);
    });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("response", (r) => { if (r.status() >= 500) problems.push(`5xx: ${r.status()} ${r.url()}`); });
    await use(page);
    expect(problems, "console errors or 5xx responses").toEqual([]);
  },
});
export { expect };

/** App alerts only: Next injects its own role=alert route announcer. */
export const alertBox = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');
