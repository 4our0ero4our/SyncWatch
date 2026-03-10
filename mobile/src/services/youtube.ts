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

export async function searchYouTubeVideos(
  query: string,
  options: { maxResults?: number; pageToken?: string } = {}
): Promise<{ items: YouTubeSearchItem[]; nextPageToken?: string }> {
  const { maxResults = 20, pageToken } = options;
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
  return { items, nextPageToken: data.nextPageToken };
}

export async function fetchYouTubeHomepage(
  pageToken?: string
): Promise<{ items: YouTubeSearchItem[]; nextPageToken?: string }> {
  return searchYouTubeVideos(DEFAULT_HOMEPAGE_QUERY, { maxResults: 20, pageToken });
}
