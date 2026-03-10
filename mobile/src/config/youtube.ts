const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export function getYouTubeApiKey(): string {
  const key = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
  if (!key) {
    console.warn("[YouTube] EXPO_PUBLIC_YOUTUBE_API_KEY is not set. Add it to your .env.");
    return "";
  }
  return key;
}

export function getYouTubeApiBase(): string {
  return YOUTUBE_API_BASE;
}

export const DEFAULT_HOMEPAGE_QUERY = "official movie trailers";
