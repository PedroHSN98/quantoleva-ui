import { expect, test } from "@playwright/test";
import { gradeFromRules, ramp, scoreFeatures, type Features } from "../src/lib/grading";

const MB = 1024 * 1024;
const grade = (f: Features) => gradeFromRules(scoreFeatures(f));

test.describe("grading (pure logic)", () => {
  test("G1 ramp: full up to the first limit, zero from the second, straight line between", () => {
    expect(ramp(1, 2, 10)).toBe(100);
    expect(ramp(2, 2, 10)).toBe(100);
    expect(ramp(6, 2, 10)).toBe(50);
    expect(ramp(10, 2, 10)).toBe(0);
    expect(ramp(99, 2, 10)).toBe(0);
  });

  test("G2 a lean page gets A", () => {
    const r = grade({ loadMs: 900, pageBytes: 0.9 * MB, count: 47, imageBytes: 0.3 * MB, scripts: 11, domains: 4 });
    expect(r.grade).toBe("A");
  });

  test("G3 a typical heavy page (4.5 MB, 130 requests, 1.3 s) is not an F", () => {
    const r = grade({ loadMs: 1300, pageBytes: 4.5 * MB, count: 130, imageBytes: 2 * MB, scripts: 45, domains: 10 });
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.grade).not.toBe("F");
  });

  test("G4 a very heavy and slow page is still an F", () => {
    const r = grade({ loadMs: 20_000, pageBytes: 12 * MB, count: 400, imageBytes: 8 * MB, scripts: 100, domains: 60 });
    expect(r.grade).toBe("F");
    expect(r.score).toBeLessThan(10);
  });

  test("G5 one heavy-but-fast page no longer zeroes everything: size rules overlap, time counts more", () => {
    const heavyFast = grade({ loadMs: 500, pageBytes: 9 * MB, count: 120, imageBytes: 3 * MB, scripts: 30, domains: 8 });
    expect(heavyFast.score).toBeGreaterThan(50);
  });

  test("G6 slow time pulls the grade down more than a high domain count", () => {
    const base: Features = { loadMs: 1000, pageBytes: 1 * MB, count: 40, imageBytes: 0.5 * MB, scripts: 10, domains: 5 };
    const slow = grade({ ...base, loadMs: 10_000 }).score;
    const manyDomains = grade({ ...base, domains: 40 }).score;
    expect(slow).toBeLessThan(manyDomains);
  });

  test("G7 every rule stays between 0 and 100", () => {
    for (const r of scoreFeatures({ loadMs: 1e9, pageBytes: 1e12, count: 1e6, imageBytes: 1e12, scripts: 1e6, domains: 1e6 })) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });
});
