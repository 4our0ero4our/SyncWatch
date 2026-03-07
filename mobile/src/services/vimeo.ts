import { getVimeoAccessToken, getVimeoApiBase, DEFAULT_HOMEPAGE_QUERIES } from "@/src/config/vimeo";

export type VimeoVideo = {
  id: string;
  title: string;
  description: string;
  thumbnailUri: string;
  durationSeconds: number;
  embedUrl: string;
};

type VimeoPictures = {
  sizes?: Array<{ link: string; width: number; height: number }>;
};

type VimeoVideoResource = {
  uri: string;
  name: string;
  description: string | null;
  duration: number;
  pictures?: VimeoPictures;
  privacy?: {
    embed?: string;
    view?: string;
  };
};

type VimeoSearchResponse = {
  data?: VimeoVideoResource[];
  total?: number;
  page?: number;
};

function parseVideoId(uri: string): string {
  const match = uri.match(/\/videos\/(\d+)/);
  return match ? match[1] : uri.replace(/^\//, "");
}

function toVimeoVideo(res: VimeoVideoResource): VimeoVideo {
  const id = parseVideoId(res.uri);
  const thumbnailUri =
    res.pictures?.sizes?.sort((a, b) => b.width - a.width)[0]?.link ??
    "";
  return {
    id,
    title: res.name || "Untitled",
    description: res.description || "",
    thumbnailUri,
    durationSeconds: res.duration || 0,
    embedUrl: `https://player.vimeo.com/video/${id}`,
  };
}

async function vimeoFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = getVimeoAccessToken();
  if (!token) {
    throw new Error("Vimeo access token not configured");
  }
  const url = new URL(path, getVimeoApiBase());
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vimeo API error: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function searchVimeoVideos(
  query: string,
  page = 1,
  perPage = 20
): Promise<VimeoVideo[]> {
  const trimmed = query.trim();
  const data = await vimeoFetch<VimeoSearchResponse>("/videos", {
    query: trimmed || "feature film",
    sort: "duration",
    direction: "desc",
    per_page: String(perPage),
    page: String(page),
    // Only return videos that Vimeo marks as embeddable.
    filter: "embeddable",
    filter_embeddable: "true",
    embeddable: "true",
  });
  const raw = data.data ?? [];
  // Keep only videos that are publicly viewable and publicly embeddable.
  const list = raw.filter((video) => {
    const privacy = video.privacy || {};
    const isPublicView = privacy.view === "anybody";
    const isPublicEmbed = !privacy.embed || privacy.embed === "public";
    return isPublicView && isPublicEmbed;
  });
  return list.map(toVimeoVideo);
}

export async function fetchVimeoVideosHomepage(
  page = 1,
  perPage = 20
): Promise<VimeoVideo[]> {
  const query = DEFAULT_HOMEPAGE_QUERIES[Math.floor(Math.random() * DEFAULT_HOMEPAGE_QUERIES.length)];
  return searchVimeoVideos(query, page, perPage);
}

export async function getVimeoVideo(videoId: string): Promise<VimeoVideo | null> {
  try {
    const res = await vimeoFetch<VimeoVideoResource>(`/videos/${videoId}`);
    return toVimeoVideo(res);
  } catch {
    return null;
  }
}
