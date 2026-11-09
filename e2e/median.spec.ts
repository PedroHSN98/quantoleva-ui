import { expect, test } from "@playwright/test";
import { medianIndex, spread, type RunSummary } from "../src/lib/median";

test.describe("median of runs (pure logic)", () => {
  test("M1 three runs: the middle one wins, whatever the order", () => {
    expect(medianIndex([900, 1200, 1600])).toBe(1);
    expect(medianIndex([1600, 900, 1200])).toBe(2);
    expect(medianIndex([1200, 1600, 900])).toBe(0);
  });

  test("M2 one run is its own median", () => {
    expect(medianIndex([750])).toBe(0);
  });

  test("M3 two runs (one failed): the faster one, a real measured time", () => {
    expect(medianIndex([2000, 1000])).toBe(1);
    expect(medianIndex([1000, 2000])).toBe(0);
  });

  test("M4 ties are resolved by run order, deterministically", () => {
    expect(medianIndex([500, 500, 500])).toBe(1);
    expect(medianIndex([800, 800, 1200])).toBe(1);
    expect(medianIndex([1200, 800, 800])).toBe(2);
  });

  test("M5 empty list is an error, not a silent zero", () => {
    expect(() => medianIndex([])).toThrow();
  });

  test("M6 spread: range and warning threshold", () => {
    const run = (n: number, ms: number, med = false): RunSummary => ({ runNo: n, loadMs: ms, pageBytes: 1, requestCount: 1, isMedian: med });
    const calm = spread([run(1, 1000), run(2, 1100, true), run(3, 1150)]);
    expect(calm).toMatchObject({ min: 1000, max: 1150, median: 1100, wide: false });
    const wild = spread([run(1, 900), run(2, 1500, true), run(3, 2600)]);
    expect(wild).toMatchObject({ min: 900, max: 2600, median: 1500, wide: true });
    // fast page: big ratio but tiny gap, no warning
    expect(spread([run(1, 100), run(2, 140, true), run(3, 200)]).wide).toBe(false);
    expect(spread([run(1, 700, true)]).wide).toBe(false);
  });
});
