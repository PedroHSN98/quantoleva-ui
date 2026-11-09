/** Index of the median run by load time.
 *  Odd count: the middle one. Even count (a run failed): the faster of the two middle runs,
 *  so we never report a time that no run actually had. Ties keep the earlier run. */
export function medianIndex(loadTimes: number[]): number {
  if (loadTimes.length === 0) throw new Error("no runs");
  const order = loadTimes
    .map((ms, i) => ({ ms, i }))
    .sort((a, b) => a.ms - b.ms || a.i - b.i);
  return order[Math.floor((order.length - 1) / 2)].i;
}

export interface RunSummary {
  runNo: number;
  loadMs: number;
  pageBytes: number;
  requestCount: number;
  isMedian: boolean;
}

/** Fastest, slowest and whether the spread is wide enough to warn about. */
export function spread(runs: RunSummary[]) {
  const times = runs.map((r) => r.loadMs);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const median = runs.find((r) => r.isMedian)?.loadMs ?? min;
  // Wide = the slowest run is more than 25% above the fastest, and the gap is over 150 ms
  // (a few ms of difference on a very fast page is not worth a warning).
  const wide = runs.length > 1 && max - min > 150 && (max - min) / Math.max(median, 1) > 0.25;
  return { min, max, median, wide };
}
