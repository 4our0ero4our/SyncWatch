import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, View, StatusBar } from "react-native";
import StackHeader from "@/src/components/StackHeader";
import RoomWebView from "@/src/components/RoomWebView";
import RoomChat from "@/src/components/RoomChat";
import { useAuth } from "@/src/context/AuthContext";
import { getRoom, joinRoom, updateRoomPlayback } from "@/src/services/rooms";
import { StyleSheet } from "react-native-unistyles";

const WATCH_ROOM_BG = "#0B0B0F";
const ROOM_POLL_INTERVAL_MS = 3000;

export default function RoomWebViewScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState<string>("Watch Party");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHostRef = useRef(false);

  const setPlayingFromHost = useCallback((next: boolean) => {
    setIsPlaying(next);
  }, []);

  const fetchRoom = useCallback(async () => {
    if (!roomId || !token) return;
    try {
      const room = await getRoom(roomId, token);
      const host = room.hostId === user?.id;
      setIsHost(host);
      isHostRef.current = host;
      setRoomName(room.name || "Watch Party");
      setVideoId(room.videoId ?? null);
      setIsPlaying(room.isPlaying ?? false);
      setProgress(room.progress ?? 0);
    } catch (e) {
      console.error("[RoomWebViewScreen] fetchRoom failed", e);
    }
  }, [roomId, token, user?.id]);

  useEffect(() => {
    if (!roomId || !token) {
      setLoading(false);
      return;
    }
    fetchRoom()
      .then(() => joinRoom(roomId, token).catch(() => {}))
      .finally(() => setLoading(false));
  }, [roomId, token, fetchRoom]);

  useEffect(() => {
    if (!roomId || !token || loading) return;
    pollRef.current = setInterval(() => {
      fetchRoom().catch(() => {});
    }, ROOM_POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [roomId, token, loading, fetchRoom]);

  useEffect(() => {
    return () => {
      if (isHostRef.current && roomId && token) {
        updateRoomPlayback(roomId, { isPlaying: false }, token).catch(() => {});
        console.log("[RoomWebViewScreen] host left, set isPlaying=false");
      }
    };
  }, [roomId, token]);

  const handleEndParty = useCallback(async () => {
    if (!isHost || !roomId || !token) return;
    try {
      await updateRoomPlayback(roomId, { isCompleted: true, isPlaying: false }, token);
      console.log("[RoomWebViewScreen] party ended by host");
      router.back();
    } catch (e) {
      console.error("[RoomWebViewScreen] end party failed", e);
    }
  }, [isHost, roomId, token, router]);

  if (!roomId || !token) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <StackHeader handleBack={() => router.back()} title="Watch Party" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: WATCH_ROOM_BG }]} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor={WATCH_ROOM_BG} />
      <RoomWebView
        roomId={roomId}
        token={token}
        isHost={isHost}
        videoId={videoId}
        isPlaying={isPlaying}
        initialProgress={progress}
        roomName={roomName}
        onBack={() => router.back()}
        onEndParty={handleEndParty}
        onPlayStateChange={setPlayingFromHost}
      />
      <View style={styles.chatWrap}>
        <RoomChat roomId={roomId} token={token} />
      </View>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create((theme, rt) => ({
  container: { flex: 1, backgroundColor: theme.color.background },
  webviewWrap: { flex: 1 },
  chatWrap: { flex: 1 },
}));
