import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";
import StackHeader from "@/src/components/StackHeader";
import RoomWebView from "@/src/components/RoomWebView";
import RoomChat from "@/src/components/RoomChat";
import { useAuth } from "@/src/context/AuthContext";
import { getRoom, joinRoom } from "@/src/services/rooms";
import { StyleSheet } from "react-native-unistyles";

export default function RoomWebViewScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movieTitle, setMovieTitle] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  const provider = useMemo(
    () => user?.streamingProvider ?? "netflix",
    [user?.streamingProvider],
  );

  const urlMatchesProvider = (url: string | null, p: typeof provider) => {
    if (!url) return false;
    if (p === "netflix") return url.includes("netflix.com");
    if (p === "prime") return url.includes("primevideo.com");
    if (p === "youtube")
      return url.includes("youtube.com") || url.includes("youtu.be");
    return false;
  };

  useEffect(() => {
    if (!roomId || !token) {
      setLoading(false);
      return;
    }
    getRoom(roomId, token)
      .then((room) => {
        const host = room.hostId === user?.id;
        setIsHost(host);
        setMovieTitle(room.movieTitle ?? null);
        const roomUrl = room.currentVideoUrl ?? null;
        if (roomUrl && !urlMatchesProvider(roomUrl, provider)) {
          console.log(
            "[RoomWebViewScreen] ignoring currentVideoUrl due to provider mismatch",
            {
              roomUrl,
              provider,
            },
          );
          setCurrentVideoUrl(null);
        } else {
          setCurrentVideoUrl(roomUrl);
        }
        joinRoom(roomId, token).catch(() => {});
      })
      .catch((e) => {
        console.error("[RoomWebViewScreen] failed to load room", e);
      })
      .finally(() => setLoading(false));
  }, [roomId, token, user?.id]);

  useEffect(() => {
    if (!roomId || !token || loading) return;
    pollRef.current = setInterval(fetchRoom, ROOM_POLL_INTERVAL_MS);
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
  chatWrap: { maxHeight: 320 },
}));
