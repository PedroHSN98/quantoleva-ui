/** Bytes as "MB" (2 decimals) above 1 MB, otherwise "KB" (1 decimal). Shared across views. */
export function formatBytes(b: number): string {
  return b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;
}
