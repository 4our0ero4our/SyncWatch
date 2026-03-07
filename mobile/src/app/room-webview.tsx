import React, { useState, useEffect } from "react";
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !token) {
      setLoading(false);
      return;
    }
    getRoom(roomId, token)
      .then((room) => {
        setIsHost(room.hostId === user?.id);
        setVideoUrl(room.videoUrl ?? null);
        joinRoom(roomId, token).catch(() => {});
      })
      .catch((e) => {
        console.error("[RoomWebViewScreen] failed to load room", e);
      })
      .finally(() => setLoading(false));
  }, [roomId, token, user?.id]);

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
          isHost={isHost}
          videoUrl={videoUrl}
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
  webviewWrap: {
    width: "100%",
    height: 250,
    backgroundColor: "#000",
  },
  chatWrap: {
    flex: 1,
  },
});
