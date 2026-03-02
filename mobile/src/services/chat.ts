import { API_BASE_URL, ROOMS_PATH } from "@/src/config/api";

export type ChatMessage = {
  id: string;
  roomId?: string;
  userId: string;
  type: "text" | "reaction";
  content: string;
  createdAt: string;
};

export async function getMessages(
  roomId: string,
  token: string,
  limit = 50,
  before?: string
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  const res = await fetch(
    `${API_BASE_URL}${ROOMS_PATH}/${roomId}/messages?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Get messages failed: ${res.status}`);
  const data = (await res.json()) as { messages: ChatMessage[] };
  return data.messages ?? [];
}

export async function sendMessage(
  roomId: string,
  token: string,
  type: "text" | "reaction",
  content: string
): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}/${roomId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Send message failed: ${res.status}`);
  }
  return (await res.json()) as ChatMessage;
}
