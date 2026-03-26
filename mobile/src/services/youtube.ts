import { getYouTubeApiKey, getYouTubeApiBase, DEFAULT_HOMEPAGE_QUERY } from "@/src/config/youtube";

export type YouTubeSearchItem = {
  id: string;
  title: string;
  description: string;
  thumbnailUri: string;
  videoId: string;
};

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      thumbnails?: { high?: { url?: string }; default?: { url?: string } };
    };
  }>;
  nextPageToken?: string;
};

type YouTubeDurationsResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string; // ISO 8601 (e.g. PT1H2M10S)
    };
  }>;
};

async function youtubeFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = getYouTubeApiKey();
  if (!key) throw new Error("YouTube API key is not configured");
  const search = new URLSearchParams({ ...params, key });
  const url = `${getYouTubeApiBase()}${path}?${search.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `YouTube API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function parseISO8601DurationToSeconds(duration: string): number | null {
  const match = duration.match(/^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const total = hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) ? total : null;
}

async function getVideoDurationsSeconds(videoIds: string[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(videoIds)).filter(Boolean);
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 50) chunks.push(unique.slice(i, i + 50));

  const durationMap: Record<string, number> = {};
  await Promise.all(
    chunks.map(async (chunk) => {
      if (chunk.length === 0) return;
      const data = await youtubeFetch<YouTubeDurationsResponse>("/videos", {
        part: "contentDetails",
        id: chunk.join(","),
      });
      for (const item of data.items ?? []) {
        const id = item.id;
        const iso = item.contentDetails?.duration;
        if (!id || !iso) continue;
        const seconds = parseISO8601DurationToSeconds(iso);
        if (seconds == null) continue;
        durationMap[id] = seconds;
      }
    })
  );

  return durationMap;
}

export async function searchYouTubeVideos(
  query: string,
  options: { maxResults?: number; pageToken?: string; excludeShorts?: boolean } = {}
): Promise<{ items: YouTubeSearchItem[]; nextPageToken?: string }> {
  const { maxResults = 20, pageToken, excludeShorts = true } = options;
  const q = (query || DEFAULT_HOMEPAGE_QUERY).trim() || DEFAULT_HOMEPAGE_QUERY;
  const data = await youtubeFetch<YouTubeSearchResponse>("/search", {
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    q,
    maxResults: String(maxResults),
    ...(pageToken ? { pageToken } : {}),
  });
  const items: YouTubeSearchItem[] = [];
  for (const item of data.items ?? []) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;
    const sn = item.snippet;
    const thumb = sn?.thumbnails?.high?.url ?? sn?.thumbnails?.default?.url ?? "";
    items.push({
      id: videoId,
      videoId,
      title: sn?.title ?? "",
      description: sn?.description ?? "",
      thumbnailUri: thumb,
    });
  }

  if (excludeShorts && items.length > 0) {
    const MIN_DURATION_SECONDS = 5 * 60;
    const durations = await getVideoDurationsSeconds(items.map((i) => i.videoId));
    const filtered = items.filter((i) => {
      const seconds = durations[i.videoId];
      if (seconds == null) return true; // if duration missing, don't accidentally remove everything
      return seconds >= MIN_DURATION_SECONDS;
    });
    return { items: filtered, nextPageToken: data.nextPageToken };
  }

  return { items, nextPageToken: data.nextPageToken };
}

export async function fetchYouTubeHomepage(
  pageToken?: string
): Promise<{ items: YouTubeSearchItem[]; nextPageToken?: string }> {
  return searchYouTubeVideos(DEFAULT_HOMEPAGE_QUERY, { maxResults: 20, pageToken });
}
