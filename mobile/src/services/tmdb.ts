import {
  TMDB_BASE_URL,
  TMDB_IMAGE_BASE_URL,
  getTmdbApiKey,
} from "@/src/config/tmdb";
import { MovieProps } from "@/src/screens/homePage/CreateParty/types";

type TmdbMovieResult = {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string | null;
};

type TmdbPopularResponse = {
  results: TmdbMovieResult[];
};

function mapTmdbToMovieProps(result: TmdbMovieResult): MovieProps {
  return {
    id: result.id,
    title: result.title,
    image: result.poster_path
      ? { uri: `${TMDB_IMAGE_BASE_URL}${result.poster_path}` }
      : require("../assets/images/image1.jpg"),
    description: result.overview ?? undefined,
  };
}

/**
 * Fetches movie search results from TMDB and returns them in app MovieProps shape.
 */
export async function fetchSearchMovies(query: string): Promise<MovieProps[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];
  const url = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(trimmed)}&page=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB search failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as TmdbPopularResponse;
  return (data.results ?? []).map(mapTmdbToMovieProps);
}

/**
 * Fetches popular movies from TMDB and returns them in app MovieProps shape.
 */
export async function fetchPopularMovies(): Promise<MovieProps[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    return [];
  }
  const url = `${TMDB_BASE_URL}/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as TmdbPopularResponse;
  return (data.results ?? []).map(mapTmdbToMovieProps);
}

/** Maps our app provider IDs to TMDB provider names (flatrate). */
const TMDB_PROVIDER_NAMES: Record<string, string> = {
  netflix: "Netflix",
  prime: "Amazon Prime Video",
};

type TmdbWatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
};

type TmdbWatchProvidersResponse = {
  id: number;
  results?: {
    US?: {
      flatrate?: TmdbWatchProvider[];
      rent?: TmdbWatchProvider[];
      buy?: TmdbWatchProvider[];
    };
  };
};

const TMDB_FETCH_TIMEOUT_MS = 8000;

/**
 * Fetches watch providers for a movie (e.g. Netflix, Prime Video).
 * Returns true if the given app provider (netflix | prime) is available for streaming in US.
 * On timeout or network error, returns true (assume available) so the user isn't blocked.
 */
export async function isMovieOnProvider(
  movieId: number,
  appProvider: "netflix" | "prime"
): Promise<boolean> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    return true;
  }
  const url = `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TMDB_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return true;
    }
    const data = (await res.json()) as TmdbWatchProvidersResponse;
    const usProviders = data.results?.US;
    const flatrate = usProviders?.flatrate ?? [];
    const tmdbName = TMDB_PROVIDER_NAMES[appProvider];
    return flatrate.some((p) => p.provider_name === tmdbName);
  } catch (e) {
    clearTimeout(timeoutId);
    if ((e as Error)?.name === "AbortError") {
      return true;
    }
    return true;
  }
}