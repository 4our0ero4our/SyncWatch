import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, View, StatusBar, Alert } from "react-native";
import StackHeader from "@/src/components/StackHeader";
import RoomWebView from "@/src/components/RoomWebView";
import RoomChat from "@/src/components/RoomChat";
import { useAuth } from "@/src/context/AuthContext";
import {
  getRoom,
  joinRoom,
  leaveWaitingRoom,
  updateRoomPlayback,
} from "@/src/services/rooms";
import { StyleSheet } from "react-native-unistyles";
import { stashHostPartySummaryIntent } from "@/src/utils/hostPartySummaryIntent";

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
  const [hostSessionActive, setHostSessionActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHostRef = useRef(false);
  const viewerJoinedRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const hostSummaryNavigatedRef = useRef(false);

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
      setHostSessionActive(room.hostSessionActive ?? false);
      setIsCompleted(room.isCompleted ?? false);
    } catch (e) {
      console.error("[RoomWebViewScreen] fetchRoom failed", e);
    }
  }, [roomId, token, user?.id]);

  useEffect(() => {
    if (!roomId || !token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    viewerJoinedRef.current = false;
    sessionEndedRef.current = false;
    (async () => {
      try {
        const room = await getRoom(roomId, token);
        if (cancelled) return;
        const host = room.hostId === user?.id;
        setIsHost(host);
        isHostRef.current = host;
        setRoomName(room.name || "Watch Party");
        setVideoId(room.videoId ?? null);
        setIsPlaying(room.isPlaying ?? false);
        setProgress(room.progress ?? 0);
        setIsCompleted(room.isCompleted ?? false);
        const activeNow = room.hostSessionActive === true;
        setHostSessionActive(activeNow);
        if (host && room.isCompleted === true) {
          hostSummaryNavigatedRef.current = true;
        }
        if (host) {
          await updateRoomPlayback(roomId, { hostSessionActive: true }, token);
          if (!cancelled) setHostSessionActive(true);
        }

        await joinRoom(roomId, token);
        await leaveWaitingRoom(roomId, token).catch(() => {});
        if (!cancelled) {
          viewerJoinedRef.current = true;
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Could not join this party.";
        console.error("[RoomWebViewScreen] init failed", e);
        Alert.alert("Cannot join", msg, [{ text: "OK", onPress: () => router.back() }]);
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, token, user?.id, router]);

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
    if (loading || isHost) return;
    if (!viewerJoinedRef.current) return;
    if (sessionEndedRef.current) return;

    if (isCompleted) {
      sessionEndedRef.current = true;
      router.replace({ pathname: "/(tabs)/parties" });
    }
  }, [loading, isHost, isCompleted, router]);

  useEffect(() => {
    if (loading || !isHost || !isCompleted || !viewerJoinedRef.current || hostSummaryNavigatedRef.current) {
      return;
    }
    hostSummaryNavigatedRef.current = true;
    stashHostPartySummaryIntent({
      roomId: roomId ?? "",
      durationSec: Math.max(0, Math.floor(progress)),
    });
    router.replace({ pathname: "/(tabs)/parties" });
  }, [loading, isHost, isCompleted, roomId, progress, router]);

  useEffect(() => {
    return () => {
      if (isHostRef.current && roomId && token) {
        updateRoomPlayback(roomId, { hostSessionActive: false, isPlaying: false }, token).catch(() => {});
        console.log("[RoomWebViewScreen] host left watch room; session paused for viewers");
      }
    };
  }, [roomId, token]);

  const handleEndParty = useCallback(async () => {
    if (!isHost || !roomId || !token) return;
    if (hostSummaryNavigatedRef.current) return;
    hostSummaryNavigatedRef.current = true;
    setIsPlaying(false);
    setIsCompleted(true);
    try {
      await updateRoomPlayback(roomId, { isCompleted: true, isPlaying: false, hostSessionActive: false }, token);
      console.log("[RoomWebViewScreen] party ended by host");
      stashHostPartySummaryIntent({
        roomId,
        durationSec: Math.max(0, Math.floor(progress)),
      });
      router.replace({ pathname: "/(tabs)/parties" });
    } catch (e) {
      console.error("[RoomWebViewScreen] end party failed", e);
      hostSummaryNavigatedRef.current = false;
      setIsCompleted(false);
    }
  }, [isHost, roomId, token, progress, router]);

  const handleBackFromRoom = useCallback(async () => {
    if (isHost && roomId && token) {
      try {
        await updateRoomPlayback(roomId, { hostSessionActive: false, isPlaying: false }, token);
      } catch (e) {
        console.warn("[RoomWebViewScreen] host back cleanup failed", e);
      }
    }
    router.back();
  }, [isHost, roomId, token, router]);

  /** When set, viewer sees the dim overlay (same as "host stepped away") so playback stays visually locked to the host. */
  const viewerPlaybackHold: "away" | "paused" | null =
    isHost || isCompleted
      ? null
      : !hostSessionActive
        ? "away"
        : !isPlaying
          ? "paused"
          : null;

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
        isPlaying={isPlaying && !isCompleted}
        initialProgress={progress}
        roomName={roomName}
        viewerPlaybackHold={viewerPlaybackHold}
        onBack={handleBackFromRoom}
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
