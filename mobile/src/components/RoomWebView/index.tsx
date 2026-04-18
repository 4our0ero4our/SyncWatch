import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable } from "react-native";
import YoutubeIframe, { YoutubeIframeRef } from "react-native-youtube-iframe";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import Typography from "@/src/components/common/Typography";
import { BackIcon } from "@/src/assets/svgs";
import { updateRoomPlayback } from "@/src/services/rooms";

const PLAYER_HEIGHT = 280;
const PROGRESS_PUSH_MS = 5000;
const UI_POLL_MS = 750;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Status = "upcoming" | "playing" | "ended";

type RoomWebViewProps = {
  roomId: string;
  token: string;
  isHost: boolean;
  videoId: string | null;
  isPlaying: boolean;
  initialProgress?: number;
  roomName: string;
  /** Viewer-only: dim overlay so the YouTube area stays non-interactive and matches host pause/away. */
  viewerPlaybackHold?: "away" | "paused" | null;
  onBack: () => void;
  onEndParty?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
};

export default function RoomWebView({
  roomId,
  token,
  isHost,
  videoId,
  isPlaying,
  initialProgress = 0,
  roomName,
  viewerPlaybackHold = null,
  onBack,
  onEndParty,
  onPlayStateChange,
}: RoomWebViewProps) {
  const { theme } = useUnistyles();
  const playerRef = useRef<YoutubeIframeRef>(null);
  const seekedToInitial = useRef(false);
  const progressBarWidth = useRef(0);

  const [status, setStatus] = useState<Status>("upcoming");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const updatePlayback = useCallback(
    async (updates: { progress?: number; isPlaying?: boolean; isCompleted?: boolean }) => {
      try {
        console.log("[RoomWebView] updateRoomPlayback", { roomId, updates });
        await updateRoomPlayback(roomId, updates, token);
      } catch (e) {
        console.warn("[RoomWebView] updateRoomPlayback failed", e);
      }
    },
    [roomId, token]
  );

  const onChangeState = useCallback(
    (state: string) => {
      console.log("[RoomWebView] player state", { state, isHost });
      if (state === "playing") setStatus("playing");
      if (state === "paused") setStatus((prev) => (prev === "ended" ? "ended" : "playing"));
      if (state === "ended") setStatus("ended");

      if (!isHost) return;
      if (state === "playing") updatePlayback({ isPlaying: true, isCompleted: false });
      if (state === "paused") updatePlayback({ isPlaying: false });
      if (state === "ended") updatePlayback({ isPlaying: false, isCompleted: true });
    },
    [isHost, updatePlayback]
  );

  const onReady = useCallback(() => {
    if (initialProgress > 0 && !seekedToInitial.current) {
      seekedToInitial.current = true;
      playerRef.current?.seekTo(initialProgress, true);
      setCurrentTime(initialProgress);
      console.log("[RoomWebView] seekTo initialProgress", initialProgress);
    }
  }, [initialProgress]);

  useEffect(() => {
    if (isHost || !videoId || !playerRef.current) return;
    const target = Math.floor(initialProgress ?? 0);
    if (!Number.isFinite(target) || target < 0) return;
    playerRef.current
      .getCurrentTime()
      .then((t) => {
        if (Math.abs(t - target) > 2) {
          playerRef.current?.seekTo(target, true);
          setCurrentTime(target);
          console.log("[RoomWebView] viewer sync seek from polled progress", { target });
        }
      })
      .catch(() => {});
  }, [initialProgress, isHost, videoId]);

  useEffect(() => {
    if (!videoId) return;
    const id = setInterval(() => {
      playerRef.current?.getCurrentTime().then(setCurrentTime).catch(() => {});
      playerRef.current?.getDuration().then(setDuration).catch(() => {});
    }, UI_POLL_MS);
    return () => clearInterval(id);
  }, [videoId]);

  useEffect(() => {
    console.log("[RoomWebView] timeline", {
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      status,
      isPlaying,
    });
  }, [currentTime, duration, status, isPlaying]);

  useEffect(() => {
    if (!isHost || !videoId) return;
    const id = setInterval(() => {
      playerRef.current
        ?.getCurrentTime()
        .then((t) => {
          const progress = Math.floor(t);
          if (Number.isFinite(progress) && progress >= 0) updatePlayback({ progress });
        })
        .catch(() => {});
    }, PROGRESS_PUSH_MS);
    return () => clearInterval(id);
  }, [isHost, videoId, updatePlayback]);

  const handlePlayPause = useCallback(() => {
    if (!isHost) return;
    const next = !isPlaying;
    onPlayStateChange?.(next);
    updatePlayback({ isPlaying: next });
    console.log("[RoomWebView] control play/pause", { next });
  }, [isHost, isPlaying, onPlayStateChange, updatePlayback]);

  const seekRelative = useCallback(
    async (deltaSeconds: number) => {
      if (!playerRef.current) return;
      try {
        const t = await playerRef.current.getCurrentTime();
        const d = await playerRef.current.getDuration();
        const next = Math.max(0, Math.min(d || t + Math.abs(deltaSeconds), t + deltaSeconds));
        playerRef.current.seekTo(next, true);
        setCurrentTime(next);
        if (isHost) updatePlayback({ progress: Math.floor(next) });
        console.log("[RoomWebView] control seek", { deltaSeconds, to: next });
      } catch {}
    },
    [isHost, updatePlayback]
  );

  const handleProgressPress = useCallback(
    (evt: { nativeEvent: { locationX?: number } }) => {
      if (!isHost || !playerRef.current || duration <= 0) return;
      const w = progressBarWidth.current;
      const x = evt.nativeEvent?.locationX ?? 0;
      const ratio = w > 0 ? Math.max(0, Math.min(1, x / w)) : 0;
      const next = duration * ratio;
      playerRef.current.seekTo(next, true);
      setCurrentTime(next);
      updatePlayback({ progress: Math.floor(next) });
      console.log("[RoomWebView] control progress seek", { seconds: next });
    },
    [duration, isHost, updatePlayback]
  );

  const progressRatio = useMemo(() => (duration > 0 ? currentTime / duration : 0), [currentTime, duration]);

  if (!videoId) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.color.background }]}>
        <View style={styles.headerOverlay} pointerEvents="box-none">
          <Pressable onPress={onBack} style={styles.headerBack}>
            <BackIcon width={18} height={16} color="#fff" />
          </Pressable>
          <Typography variant="body" weight="bold" color="#fff" numberOfLines={1} style={styles.headerTitle}>
            {roomName}
          </Typography>
        </View>
        <Typography variant="body" color={theme.color.textMuted}>
          No video set for this party.
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.playerWrap}>
      <View style={styles.videoContainer}>
        <YoutubeIframe
          ref={playerRef}
          height={PLAYER_HEIGHT}
          videoId={videoId}
          play={isPlaying}
          onChangeState={onChangeState}
          onReady={onReady}
          initialPlayerParams={{
            controls: false,
            modestbranding: true,
            rel: 0,
            start: Math.floor(initialProgress),
          }}
          webViewStyle={[styles.playerFixed, { backgroundColor: "#000" }]}
          webViewProps={{
            style: { backgroundColor: "#000" },
            // YouTube WebView may still show a center play affordance when paused; block taps so viewers follow host only.
            pointerEvents: isHost ? "auto" : "none",
          }}
        />

        {viewerPlaybackHold ? (
          <View style={styles.viewerHoldOverlay} pointerEvents="auto">
            <Typography variant="smallBody" weight="medium" color="#fff" align="center" style={styles.viewerHoldText}>
              {viewerPlaybackHold === "away"
                ? "The host stepped away. Playback is paused until they return."
                : "The host paused playback."}
            </Typography>
          </View>
        ) : null}

        <View style={styles.headerOverlay} pointerEvents="box-none">
          <View style={styles.headerRow}>
            <Pressable onPress={onBack} style={styles.headerBack}>
              <BackIcon width={18} height={16} color="#fff" />
            </Pressable>
            <Typography variant="body" weight="bold" color="#fff" numberOfLines={1} style={styles.headerTitle}>
              {roomName}
            </Typography>
            {isHost && onEndParty ? (
              <Pressable onPress={onEndParty} style={styles.endPartyBtn}>
                <Typography variant="smallBody" weight="bold" color="#fff">
                  End party
                </Typography>
              </Pressable>
            ) : (
              <View style={styles.endPartyPlaceholder} />
            )}
          </View>
        </View>

        {isHost && (
          <>
            <View style={styles.controlsOverlay} pointerEvents="box-none">
              <View style={styles.controlsRow}>
                <Pressable onPress={() => seekRelative(-10)} style={styles.controlBtn}>
                  <Typography variant="body" color="#fff">
                    {"\u2039\u2039"}
                  </Typography>
                </Pressable>
                <Pressable onPress={handlePlayPause} style={styles.controlBtn}>
                  <Typography variant="subHeading" color="#fff">
                    {isPlaying ? "||" : "\u25B6"}
                  </Typography>
                </Pressable>
                <Pressable onPress={() => seekRelative(10)} style={styles.controlBtn}>
                  <Typography variant="body" color="#fff">
                    {"\u203A\u203A"}
                  </Typography>
                </Pressable>
              </View>
            </View>
            <View style={styles.progressRow}>
              <Typography variant="caption" color="#fff">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
              <Pressable
                style={styles.progressTrack}
                onPress={handleProgressPress}
                onLayout={(e) => {
                  progressBarWidth.current = e.nativeEvent.layout.width;
                }}
              >
                <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  playerWrap: {
    width: "100%",
    height: PLAYER_HEIGHT,
    backgroundColor: "#000",
  },
  videoContainer: {
    width: "100%",
    height: PLAYER_HEIGHT,
    backgroundColor: "#000",
  },
  playerFixed: {
    width: "100%",
    height: PLAYER_HEIGHT,
  },
  viewerHoldOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 5,
  },
  viewerHoldText: {
    maxWidth: 280,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBack: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  endPartyBtn: {
    backgroundColor: "#E50914",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  endPartyPlaceholder: {
    width: 1,
  },
  controlsOverlay: {
    position: "absolute",
    bottom: 44,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  controlBtn: {
    padding: 12,
  },
  progressRow: {
    position: "absolute",
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E50914",
  },
  placeholder: {
    width: "100%",
    height: PLAYER_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
}));

