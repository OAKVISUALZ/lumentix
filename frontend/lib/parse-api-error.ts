export async function parseApiError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null);
  if (typeof payload?.message === "string") return payload.message;
  if (Array.isArray(payload?.message)) return payload.message.join(", ");
  return `Request failed with status ${response.status}`;
}

export function parseApiErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const match = err.message.match(/^API error \d+: (.+)$/);
    if (match) {
      try {
        const body = JSON.parse(match[1]);
        if (typeof body?.message === "string") return body.message;
        if (Array.isArray(body?.message)) return body.message.join(", ");
      } catch {
        return match[1];
      }
    }
    return err.message;
  }
  return "Something went wrong";
}
