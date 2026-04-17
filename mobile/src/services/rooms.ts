import { API_BASE_URL, ROOMS_PATH } from "@/src/config/api";

export type Room = {
  id: string;
  name: string;
  hostId: string;
  inviteCode: string;
  description?: string;
  movieTitle?: string;
  movieImageUrl?: string;
  videoUrl?: string;
  videoId?: string;
  progress?: number;
  isPlaying?: boolean;
  isCompleted?: boolean;
  hostSessionActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateRoomPayload = {
  name: string;
  description?: string;
  movieTitle?: string;
  movieImageUrl?: string;
  videoUrl?: string;
  videoId?: string;
};

export async function createRoom(
  payload: CreateRoomPayload,
  token: string
): Promise<Room> {
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Create room failed: ${res.status}`);
  }
  return res.json() as Promise<Room>;
}

export async function getMyRooms(token: string, isCompleted?: boolean): Promise<Room[]> {
  const query = isCompleted !== undefined ? `?isCompleted=${isCompleted}` : "";
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Get rooms failed: ${res.status}`);
  }
  return res.json() as Promise<Room[]>;
}

export async function joinRoom(roomId: string, token: string): Promise<{ roomId: string; userId: string; role: string }> {
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}/${roomId}/participants/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text || `Join room failed: ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (typeof parsed?.error === "string" && parsed.error.length > 0) {
        message = parsed.error;
      }
    } catch {
      // keep message as text
    }
    throw new Error(message);
  }
  return res.json() as Promise<{ roomId: string; userId: string; role: string }>;
}

export async function getRoom(roomId: string, token: string): Promise<Room> {
  console.log("[rooms] getRoom:", roomId);
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}/${roomId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Get room failed: ${res.status}`);
  }
  return res.json() as Promise<Room>;
}

export async function updateRoomPlayback(
  roomId: string,
  updates: { videoUrl?: string; progress?: number; isPlaying?: boolean; isCompleted?: boolean; hostSessionActive?: boolean },
  token: string
): Promise<Room> {
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}/${roomId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Update room failed: ${res.status}`);
  }
  return (await res.json()) as Room;
}

export async function updateRoomVideoUrl(
  roomId: string,
  videoUrl: string,
  token: string
): Promise<Room> {
  return updateRoomPlayback(roomId, { videoUrl }, token);
}

export async function getRoomByInviteCode(
  code: string,
  token: string
): Promise<Room> {
  const encoded = encodeURIComponent(code.trim());
  const res = await fetch(
    `${API_BASE_URL}${ROOMS_PATH}/by-code/${encoded}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Room not found: ${res.status}`);
  }
  return res.json() as Promise<Room>;
}

export type RoomParticipant = {
  userId: string;
  role: string;
  displayName?: string;
  avatar?: string;
};

export type WaitingUser = {
  userId: string;
  displayName?: string;
  avatar?: string;
};

export async function getParticipants(roomId: string, token: string): Promise<RoomParticipant[]> {
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}/${roomId}/participants`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Get participants failed: ${res.status}`);
  }
  const data = (await res.json()) as { participants: RoomParticipant[] };
  return data.participants ?? [];
}

export async function joinWaitingRoom(roomId: string, token: string): Promise<WaitingUser> {
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}/${roomId}/waiting/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Join waiting room failed: ${res.status}`);
  }
  return res.json() as Promise<WaitingUser>;
}

export async function leaveWaitingRoom(roomId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}/${roomId}/waiting/leave`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Leave waiting room failed: ${res.status}`);
  }
}

export async function getWaitingUsers(roomId: string, token: string): Promise<WaitingUser[]> {
  const res = await fetch(`${API_BASE_URL}${ROOMS_PATH}/${roomId}/waiting`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Get waiting users failed: ${res.status}`);
  }
  const data = (await res.json()) as { waitingUsers: WaitingUser[] };
  return data.waitingUsers ?? [];
}
