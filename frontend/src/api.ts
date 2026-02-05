/**
 * API base URL for backend. Empty in dev (Vite proxy). Set in production (e.g. Vercel env VITE_API_URL).
 */
export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string) ?? "";
}

/** Full URL for an API path (e.g. "/materials/inventory/recommendations"). */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base.replace(/\/$/, "")}${p}` : p;
}
