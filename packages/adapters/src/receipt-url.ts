/** Public receipt page for a task when the server omits verify_url. */
export function receiptUrlFor(apiUrl: string, taskId: string): string {
  return `${apiUrl.replace(/\/$/, '')}/receipt/${taskId}`;
}
