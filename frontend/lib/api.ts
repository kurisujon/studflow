const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const BROWSER_API_BASE_URL = "";
const SERVER_API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  DEFAULT_API_BASE_URL;

export const API_BASE_URL =
  typeof window === "undefined"
    ? SERVER_API_BASE_URL
    : BROWSER_API_BASE_URL;

export async function readAPIErrorDetail(response: Response): Promise<string> {
  const fallback = response.statusText || "Request failed.";

  try {
    const payload = (await response.clone().json()) as { detail?: unknown };
    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }
  } catch {
    // Fall through to plain-text parsing when the backend does not return JSON.
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text.trim();
    }
  } catch {
    // Keep the HTTP status text if the response body cannot be read.
  }

  return fallback;
}

export async function buildAPIError(
  response: Response,
  fallback: string,
): Promise<Error> {
  const detail = await readAPIErrorDetail(response);
  return new Error(`${fallback}: ${response.status} ${detail}`);
}
