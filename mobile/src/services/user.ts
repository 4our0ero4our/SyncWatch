import { API_BASE_URL, USERS_PATH } from "@/src/config/api";

export type StreamingProvider = "netflix" | "prime";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  streamingProvider?: StreamingProvider;
};

/**
 * Get current user's profile. Requires Authorization: Bearer <token>.
 */
export async function getProfile(token: string): Promise<UserProfile> {
  console.log("[user] getProfile: fetching");
  const res = await fetch(`${API_BASE_URL}${USERS_PATH}/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Get profile failed: ${res.status}`);
  }
  const data = (await res.json()) as UserProfile;
  console.log("[user] getProfile: success", { streamingProvider: data.streamingProvider });
  return data;
}

/**
 * Update current user's streaming provider. Requires Authorization: Bearer <token>.
 */
export async function updateStreamingProvider(
  token: string,
  streamingProvider: StreamingProvider
): Promise<UserProfile> {
  console.log("[user] updateStreamingProvider:", streamingProvider);
  const res = await fetch(`${API_BASE_URL}${USERS_PATH}/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ streamingProvider }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Update profile failed: ${res.status}`);
  }
  const data = (await res.json()) as UserProfile;
  console.log("[user] updateStreamingProvider: success", { streamingProvider: data.streamingProvider });
  return data;
}
