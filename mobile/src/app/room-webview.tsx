import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, View, StatusBar, Alert, Image, Modal, Pressable } from "react-native";
import StackHeader from "@/src/components/StackHeader";
import RoomWebView from "@/src/components/RoomWebView";
import RoomChat from "@/src/components/RoomChat";
import Typography from "@/src/components/common/Typography";
import Button from "@/src/components/common/Button";
import { useAuth } from "@/src/context/AuthContext";
import {
  getRoom,
  getParticipants,
  joinRoom,
  leaveWaitingRoom,
  updateRoomPlayback,
  type RoomParticipant,
} from "@/src/services/rooms";
import { StyleSheet } from "react-native-unistyles";
import { avatars } from "@/src/utils/dummyData";

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
  const [roomDescription, setRoomDescription] = useState<string>("");
  const [movieImageUrl, setMovieImageUrl] = useState<string | undefined>(undefined);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryParticipants, setSummaryParticipants] = useState<RoomParticipant[]>([]);
  const [summaryDuration, setSummaryDuration] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHostRef = useRef(false);
  const viewerJoinedRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const hasSeenHostLiveRef = useRef(false);
  const inactivePollsRef = useRef(0);

  const setPlayingFromHost = useCallback((next: boolean) => {
    setIsPlaying(next);
  }, []);

  const getAvatarSource = useCallback((avatarKey?: string) => {
    const id = avatarKey ? parseInt(avatarKey, 10) : NaN;
    const fallback = avatars[0]?.url;
    if (Number.isNaN(id)) return fallback;
    const found = avatars.find((a) => a.id === id);
    return found?.url ?? fallback;
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, []);

  const fetchRoom = useCallback(async () => {
    if (!roomId || !token) return;
    try {
      const room = await getRoom(roomId, token);
      const host = room.hostId === user?.id;
      setIsHost(host);
      isHostRef.current = host;
      setRoomName(room.name || "Watch Party");
      setRoomDescription(room.description || "");
      setMovieImageUrl(room.movieImageUrl || undefined);
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
    hasSeenHostLiveRef.current = false;
    inactivePollsRef.current = 0;
    (async () => {
      try {
        const room = await getRoom(roomId, token);
        if (cancelled) return;
        const host = room.hostId === user?.id;
        setIsHost(host);
        isHostRef.current = host;
        setRoomName(room.name || "Watch Party");
        setRoomDescription(room.description || "");
        setMovieImageUrl(room.movieImageUrl || undefined);
        setVideoId(room.videoId ?? null);
        setIsPlaying(room.isPlaying ?? false);
        setProgress(room.progress ?? 0);
        setIsCompleted(room.isCompleted ?? false);
        const activeNow = room.hostSessionActive === true;
        setHostSessionActive(activeNow);
        if (activeNow) {
          hasSeenHostLiveRef.current = true;
          inactivePollsRef.current = 0;
        }

        if (host) {
          await updateRoomPlayback(roomId, { hostSessionActive: true }, token);
          if (!cancelled) setHostSessionActive(true);
        }

        await joinRoom(roomId, token);
        await leaveWaitingRoom(roomId, token).catch(() => {});
        if (!cancelled) {
          viewerJoinedRef.current = true;
          if (!host) {
            // A successful viewer join implies the host session was active at join time.
            hasSeenHostLiveRef.current = true;
          }
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
      return;
    }

    if (hostSessionActive) {
      hasSeenHostLiveRef.current = true;
      inactivePollsRef.current = 0;
      return;
    }

    if (!hasSeenHostLiveRef.current) return;
    inactivePollsRef.current += 1;
    if (inactivePollsRef.current < 3) return;

    sessionEndedRef.current = true;
    Alert.alert("Session ended", "The host left the watch party.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }, [loading, isHost, hostSessionActive, isCompleted, router]);

  useEffect(() => {
    return () => {
      if (isHostRef.current && roomId && token) {
        updateRoomPlayback(roomId, { hostSessionActive: false, isPlaying: false }, token).catch(() => {});
        console.log("[RoomWebViewScreen] host left, session closed for viewers");
      }
    };
  }, [roomId, token]);

  const handleEndParty = useCallback(async () => {
    if (!isHost || !roomId || !token) return;
    try {
      const participants = await getParticipants(roomId, token).catch(() => []);
      setSummaryParticipants(participants);
      setSummaryDuration(progress);
      await updateRoomPlayback(roomId, { isCompleted: true, isPlaying: false, hostSessionActive: false }, token);
      console.log("[RoomWebViewScreen] party ended by host");
      setSummaryVisible(true);
    } catch (e) {
      console.error("[RoomWebViewScreen] end party failed", e);
    }
  }, [isHost, roomId, token, progress]);

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
        onBack={handleBackFromRoom}
        onEndParty={handleEndParty}
        onPlayStateChange={setPlayingFromHost}
      />
      <View style={styles.chatWrap}>
        <RoomChat roomId={roomId} token={token} />
      </View>
      {isHost && (
        <Modal
          visible={summaryVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setSummaryVisible(false);
            router.replace({ pathname: "/(tabs)/parties" });
          }}
        >
          <View style={styles.summaryOverlay}>
            <View style={styles.summaryWrap}>
              <Pressable
                style={styles.summaryCloseBtn}
                onPress={() => {
                  setSummaryVisible(false);
                  router.replace({ pathname: "/(tabs)/parties" });
                }}
              >
                <Typography variant="body" weight="bold" color="#fff">
                  ×
                </Typography>
              </Pressable>
            <Typography variant="body" weight="bold">
              That was fun!🎉
            </Typography>
            <Typography variant="smallBody" color="#A9A9B2" style={{ marginTop: 4, marginBottom: 12 }}>
              See your party summary below.
            </Typography>

            <View style={styles.summaryCard}>
              <Typography variant="subHeading" weight="bold" align="center">
                {roomName}
              </Typography>
              {!!roomDescription && (
                <Typography variant="smallerBody" color="#A9A9B2" align="center" style={{ marginTop: 4 }}>
                  {roomDescription}
                </Typography>
              )}

              <View style={styles.summaryPosterWrap}>
                <Image
                  source={movieImageUrl ? { uri: movieImageUrl } : require("@/src/assets/images/image1.jpg")}
                  style={styles.summaryPoster}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.summaryRow}>
                <Typography variant="smallBody" color="#A9A9B2">Hosted by:</Typography>
                <View style={styles.hostInfoRow}>
                  <Image source={getAvatarSource(user?.avatar)} style={styles.hostAvatar} />
                  <Typography variant="smallBody" weight="medium">
                    {user?.displayName ?? "Host"} (You)
                  </Typography>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Typography variant="smallBody" color="#A9A9B2">Watched by:</Typography>
                <View style={styles.watchedByRow}>
                  {summaryParticipants.slice(0, 4).map((p, idx) => (
                    <View key={p.userId} style={[styles.watcherAvatarWrap, { marginLeft: idx === 0 ? 0 : -10 }]}>
                      <Image source={getAvatarSource(p.avatar)} style={styles.watcherAvatar} />
                    </View>
                  ))}
                  {summaryParticipants.length > 4 && (
                    <View style={[styles.watcherAvatarWrap, styles.extraWatcherBadge, { marginLeft: -10 }]}>
                      <Typography variant="caption" weight="bold" color="#fff">
                        +{summaryParticipants.length - 4}
                      </Typography>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Typography variant="smallBody" color="#A9A9B2">Lasted for:</Typography>
                <Typography variant="smallBody" weight="medium">{formatDuration(summaryDuration)}</Typography>
              </View>
            </View>

            <View style={{ marginTop: 14, width: "100%" }}>
              <Button
                title="host-another-party"
                onPress={() => {
                  setSummaryVisible(false);
                  router.replace({ pathname: "/(tabs)/parties" });
                }}
              >
                Host another party
              </Button>
            </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create((theme, rt) => ({
  container: { flex: 1, backgroundColor: theme.color.background },
  webviewWrap: { flex: 1 },
  chatWrap: { flex: 1 },
  summaryWrap: {
    width: "90%",
    maxWidth: 380,
    backgroundColor: "#1A1B22",
    borderRadius: 16,
    padding: 16,
  },
  summaryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  summaryCloseBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    zIndex: 10,
  },
  summaryCard: {
    marginTop: 8,
    backgroundColor: "#111216",
    borderRadius: 14,
    padding: 12,
  },
  summaryPosterWrap: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 12,
  },
  summaryPoster: {
    width: "100%",
    height: "100%",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  hostInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hostAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  watchedByRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  watcherAvatarWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#111216",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2230",
  },
  watcherAvatar: {
    width: "100%",
    height: "100%",
  },
  extraWatcherBadge: {
    backgroundColor: "#0E9BFF",
  },
}));
