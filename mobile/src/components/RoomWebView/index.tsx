/* eslint-disable react/no-unescaped-entities */
import React, { useRef } from "react";
import { View, Pressable, Linking } from "react-native";
import { useUnistyles, StyleSheet } from "react-native-unistyles";
import Typography from "@/src/components/common/Typography";
import { updateRoomPlayback } from "@/src/services/rooms";
import { useUnistyles } from "react-native-unistyles";
import { BackIcon } from "@/src/assets/svgs";

let WebView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WebView = require("react-native-webview").WebView;
} catch {
  // WebView native module not available (e.g. Expo Go).
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type RoomWebViewProps = {
  roomId: string;
  token: string;
  isHost: boolean;
  videoId: string | null;
  isPlaying: boolean;
  initialProgress?: number;
  roomName: string;
  onBack: () => void;
  onEndParty?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
};

function WebViewFallback({
  provider,
}: {
  provider: "netflix" | "prime" | "youtube";
}) {
  const { theme } = useUnistyles();
  return (
    <View
      style={[styles.fallback, { backgroundColor: theme.color.background }]}
    >
      <Typography
        variant="body"
        weight="medium"
        color={theme.color.textMuted}
        style={{ textAlign: "center", marginBottom: 8 }}
      >
        In-app streaming needs a native build. If you opened this via Expo Go,
        that app does not include WebView.
      </Typography>
      <Typography
        variant="smallBody"
        color={theme.color.textMuted}
        style={{ textAlign: "center", marginBottom: 16 }}
      >
        Build and install once: connect your phone, run "npx expo run:android",
        then open this project from the installed app (not Expo Go).
      </Typography>
      <Pressable
        style={[styles.openBtn, { backgroundColor: theme.color.primary }]}
        onPress={() => Linking.openURL(url)}
      >
        <Typography variant="body" weight="bold" color={theme.color.white}>
          Open {provider === "netflix" ? "Netflix" : "Prime"} in browser
        </Typography>
      </Pressable>
    </View>
  );
}

export default function RoomWebView({
  roomId,
  token,
  isHost,
  videoId,
  isPlaying,
  initialProgress = 0,
  roomName,
  onBack,
  onEndParty,
  onPlayStateChange,
}: RoomWebViewProps) {
  const webViewRef = useRef<any>(null);
  const defaultUrl =
    STREAMING_BASE_URLS[provider] ?? STREAMING_BASE_URLS.netflix;
  const trimmedVideoUrl = initialVideoUrl?.trim() ?? "";
  const trimmedTitle = movieTitle?.trim() ?? "";

  let initialUrl = defaultUrl;
  let useYouTubeEmbed = false;
  let youTubeVideoId: string | null = null;

  if (trimmedVideoUrl.length > 0) {
    if (provider === "youtube") {
      try {
        const url = new URL(trimmedVideoUrl);
        if (url.hostname.includes("youtu.be")) {
          youTubeVideoId = url.pathname.replace("/", "");
        } else {
          youTubeVideoId = url.searchParams.get("v");
        }
      } catch {
        youTubeVideoId = null;
      }
      if (youTubeVideoId) {
        useYouTubeEmbed = true;
      } else {
        initialUrl = trimmedVideoUrl;
      }
    } else {
      initialUrl = trimmedVideoUrl;
    }
  } else if (trimmedTitle.length > 0) {
    const q = encodeURIComponent(trimmedTitle);
    if (provider === "netflix") {
      initialUrl = `${defaultUrl}/search?q=${q}`;
    } else if (provider === "prime") {
      initialUrl = `${defaultUrl}/search?phrase=${q}`;
    } else if (provider === "youtube") {
      initialUrl = `${defaultUrl}/results?search_query=${q}`;
    }
  }

  const handleNavigationStateChange = (navState: { url: string }) => {
    const currentUrl = navState.url;
    console.log("[RoomWebView] navigation", {
      url: currentUrl,
      provider,
      isHost,
    });
    if (isHost) {
      const isNetflixWatch = currentUrl.includes("netflix.com/watch/");
      const isPrimeWatch =
        currentUrl.includes("primevideo.com") &&
        (currentUrl.includes("/watch/") || currentUrl.includes("/gp/video/"));
      const isYoutubeWatch = currentUrl.includes("youtube.com/watch?v=");
      if (isNetflixWatch || isPrimeWatch || isYoutubeWatch) {
        console.log("[RoomWebView] detected watch URL, saving to room");
        updateRoomVideoUrl(roomId, currentUrl, token)
          .then(() => {
            onVideoUrlUpdated?.(currentUrl);
          })
          .catch(() => {});
      }
    }
  };

  const handleWebBack = () => {
    webViewRef.current?.goBack?.();
    console.log("[RoomWebView] webview goBack");
  };

  const handleChangeState = useCallback(
    (state: PLAYER_STATES) => {
      const statusStr = state === PLAYER_STATES.PLAYING ? "playing" : state === PLAYER_STATES.PAUSED ? "paused" : state === PLAYER_STATES.ENDED ? "ended" : state;
      console.log("[RoomWebView] state", { state: statusStr, isHost });
      if (state === PLAYER_STATES.ENDED) {
        setStatus("ended");
      } else if (state === PLAYER_STATES.PLAYING) {
        setStatus("playing");
      } else if (state === PLAYER_STATES.PAUSED || state === PLAYER_STATES.UNSTARTED) {
        setStatus("playing");
      }

      if (!isHost) return;
      if (state === PLAYER_STATES.PLAYING) {
        updatePlayback({ isPlaying: true });
      } else if (state === PLAYER_STATES.PAUSED || state === PLAYER_STATES.ENDED) {
        updatePlayback({ isPlaying: false });
      }
      if (state === PLAYER_STATES.ENDED) {
        updatePlayback({ isCompleted: true });
      }
    },
    [isHost, updatePlayback]
  );

  const handleReady = useCallback(() => {
    if (initialProgress > 0 && playerRef.current && !seekedToInitial.current) {
      seekedToInitial.current = true;
      playerRef.current.seekTo(initialProgress, true);
      setCurrentTime(initialProgress);
      console.log("[RoomWebView] seeked to initial progress", initialProgress);
    }
    playerRef.current?.getDuration().then((d) => {
      if (Number.isFinite(d)) setDuration(d);
    }).catch(() => {});
  }, [initialProgress]);

  useEffect(() => {
    if (!isHost || !videoId) return;
    const id = setInterval(() => {
      playerRef.current?.getCurrentTime().then((seconds) => {
        const progress = Math.floor(seconds);
        if (Number.isFinite(progress)) {
          setCurrentTime(seconds);
          updatePlayback({ progress });
        }
      }).catch(() => {});
    }, PROGRESS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isHost, videoId, updatePlayback]);

  useEffect(() => {
    const id = setInterval(() => {
      playerRef.current?.getCurrentTime().then((t) => setCurrentTime(t)).catch(() => {});
      playerRef.current?.getDuration().then((d) => setDuration(d)).catch(() => {});
    }, PROGRESS_BAR_UPDATE_MS);
    return () => clearInterval(id);
  }, [videoId]);

  const handlePlayPause = useCallback(() => {
    if (!isHost) return;
    const next = !isPlaying;
    onPlayStateChange?.(next);
    updatePlayback({ isPlaying: next });
    console.log("[RoomWebView] play/pause", { isPlaying: next });
  }, [isHost, isPlaying, updatePlayback, onPlayStateChange]);

  const handleSeekBack = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.getCurrentTime().then((t) => {
      const next = Math.max(0, t - 10);
      playerRef.current?.seekTo(next, true);
      setCurrentTime(next);
      if (isHost) updatePlayback({ progress: Math.floor(next) });
      console.log("[RoomWebView] seek back", { to: next });
    }).catch(() => {});
  }, [isHost, updatePlayback]);

  const handleSeekForward = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.getCurrentTime().then((t) => {
      playerRef.current?.getDuration().then((d) => {
        const next = Math.min(d, t + 10);
        playerRef.current?.seekTo(next, true);
        setCurrentTime(next);
        if (isHost) updatePlayback({ progress: Math.floor(next) });
        console.log("[RoomWebView] seek forward", { to: next });
      });
    }).catch(() => {});
  }, [isHost, updatePlayback]);

  const handleProgressPress = useCallback(
    (evt: { nativeEvent: { locationX?: number } }) => {
      if (!playerRef.current || !isHost) return;
      const locationX = evt.nativeEvent?.locationX ?? 0;
      const w = progressBarWidth.current;
      const ratio = w > 0 ? Math.max(0, Math.min(1, locationX / w)) : 0;
      const seekToSec = duration * ratio;
      playerRef.current.seekTo(seekToSec, true);
      setCurrentTime(seekToSec);
      updatePlayback({ progress: Math.floor(seekToSec) });
      console.log("[RoomWebView] progress bar seek", { seconds: seekToSec });
    },
    [duration, isHost, updatePlayback]
  );

  useEffect(() => {
    console.log("[RoomWebView] timeline", { currentTime: Math.floor(currentTime), duration: Math.floor(duration), status });
  }, [currentTime, duration, status]);

  if (!videoId || videoId.length < 11) {
    return (
      <View style={[styles.placeholder, styles.playerWrap]}>
        <View style={styles.headerOverlay}>
          <Pressable onPress={onBack} style={styles.headerBack}>
            <BackIcon width={18} height={16} color="#fff" />
          </Pressable>
          <Typography variant="body" weight="bold" color="#fff" numberOfLines={1} style={styles.headerTitle}>
            {roomName}
          </Typography>
        </View>
        <Typography variant="body" color={theme.color.textMuted}>
          No video set. Start a party from the lobby.
        </Typography>
      </View>
    );
  }

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={styles.playerWrap}>
      <View style={styles.videoContainer}>
        <YoutubeIframe
          ref={playerRef}
          height={PLAYER_HEIGHT}
          videoId={videoId}
          play={isPlaying}
          onChangeState={handleChangeState}
          onReady={handleReady}
        initialPlayerParams={{
          controls: false,
          modestbranding: true,
          rel: false,
          start: Math.floor(initialProgress),
        }}
        webViewStyle={[styles.playerFixed, { backgroundColor: "#000" }]}
        webViewProps={{ style: { backgroundColor: "#000" } }}
        />
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
                <Pressable onPress={handleSeekBack} style={styles.controlBtn}>
                  <Typography variant="body" color="#fff">{"\u2039\u2039"}</Typography>
                </Pressable>
                <Pressable onPress={handlePlayPause} style={styles.controlBtn}>
                  <Typography variant="subHeading" color="#fff">{isPlaying ? "||" : "\u25B6"}</Typography>
                </Pressable>
                <Pressable onPress={handleSeekForward} style={styles.controlBtn}>
                  <Typography variant="body" color="#fff">{"\u203A\u203A"}</Typography>
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

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  webview: { flex: 1 },
  controlsBar: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: "row",
    gap: 8,
  },
  playerFixed: {
    width: "100%",
    height: PLAYER_HEIGHT,
  },
  videoContainer: {
    width: "100%",
    height: PLAYER_HEIGHT,
    backgroundColor: "#000",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
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
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E50914",
    borderRadius: 2,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
}));
