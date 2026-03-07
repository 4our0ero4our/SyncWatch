const VIMEO_API_BASE = "https://api.vimeo.com";

/**
 * Set EXPO_PUBLIC_VIMEO_ACCESS_TOKEN in .env (e.g. from Vimeo app or personal access token).
 */
export function getVimeoAccessToken(): string {
  const token = process.env.EXPO_PUBLIC_VIMEO_ACCESS_TOKEN;
  if (!token) {
    console.warn("[Vimeo] EXPO_PUBLIC_VIMEO_ACCESS_TOKEN is not set");
    return "";
  }
  return token;
}

export function getVimeoApiBase(): string {
  return VIMEO_API_BASE;
}

export const DEFAULT_HOMEPAGE_QUERIES = [
  "action movie",
  "feature film",
  "full length movie",
];
