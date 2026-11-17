/**
 * Resolve a post-authentication destination to a safe same-origin path.
 * Prevents open redirects and self-redirect loops back to `/sign-in`.
 */
export function resolveSafeRedirectPath(
  rawRedirect: string | string[] | null | undefined,
  origin: string = "https://studflow.local",
  fallback: string = "/dashboard",
): string {
  const value = Array.isArray(rawRedirect) ? rawRedirect[0] : rawRedirect;
  if (!value || typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("//")) {
    return fallback;
  }

  try {
    const base = new URL(origin);
    const candidate = new URL(trimmed, base);
    if (candidate.origin !== base.origin) {
      return fallback;
    }
    if (
      candidate.pathname === "/sign-in" ||
      candidate.pathname.startsWith("/sign-in/")
    ) {
      return fallback;
    }
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return fallback;
  }
}
