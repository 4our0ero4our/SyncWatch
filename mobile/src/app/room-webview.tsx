import React, { useState, useEffect, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import StackHeader from "@/src/components/StackHeader";
import RoomWebView from "@/src/components/RoomWebView";
import RoomChat from "@/src/components/RoomChat";
import { useAuth } from "@/src/context/AuthContext";
import { getRoom, joinRoom } from "@/src/services/rooms";

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
    [user?.streamingProvider]
  );

  const urlMatchesProvider = (url: string | null, p: typeof provider) => {
    if (!url) return false;
    if (p === "netflix") return url.includes("netflix.com");
    if (p === "prime") return url.includes("primevideo.com");
    if (p === "youtube") return url.includes("youtube.com") || url.includes("youtu.be");
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
          console.log("[RoomWebViewScreen] ignoring currentVideoUrl due to provider mismatch", {
            roomUrl,
            provider,
          });
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
  }, [roomId, token, user?.id, provider]);

  const onVideoUrlUpdated = (url: string) => setCurrentVideoUrl(url);

  if (!roomId || !token) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <StackHeader handleBack={() => router.back()} title="Watch Party" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StackHeader handleBack={() => router.back()} title="Watch Party" />
      <View style={styles.webviewWrap}>
        <RoomWebView
          roomId={roomId}
          token={token}
          provider={provider}
          isHost={isHost}
          movieTitle={movieTitle}
          initialVideoUrl={currentVideoUrl}
          onVideoUrlUpdated={onVideoUrlUpdated}
        />
      </View>
      <View style={styles.chatWrap}>
        <RoomChat roomId={roomId} token={token} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webviewWrap: { flex: 1 },
  chatWrap: { maxHeight: 320 },
});
