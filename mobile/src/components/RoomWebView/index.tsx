import React, { useRef } from "react";
import { View, StyleSheet, Pressable, Linking } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import Typography from "@/src/components/common/Typography";
import { updateRoomVideoUrl } from "@/src/services/rooms";
import type { WebViewMessageEvent } from "react-native-webview";

let WebView: any = null;

try {
  WebView = require("react-native-webview").WebView;
} catch {
  // WebView native module not available (e.g. Expo Go). Use fallback.
}

const INJECT_PLAYER_LISTENERS = `
(function() {
  function attach() {
    try {
      var v = document.querySelector('video');
      if (!v || v.__syncwatchHooked) return;
      v.__syncwatchHooked = true;
      function send(type) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: type,
            currentTime: v.currentTime,
            paused: v.paused,
            duration: v.duration,
            url: window.location.href
          }));
        }
      }
      v.addEventListener('play', function() { send('play'); });
      v.addEventListener('pause', function() { send('pause'); });
      v.addEventListener('seeking', function() { send('seek'); });
      v.addEventListener('ended', function() { send('ended'); });
    } catch (e) {}
  }
  document.addEventListener('readystatechange', attach);
  setTimeout(attach, 2000);
  setTimeout(attach, 5000);
})();`;

const STREAMING_BASE_URLS: Record<string, string> = {
  netflix: "https://www.netflix.com",
  prime: "https://www.primevideo.com",
  youtube: "https://www.youtube.com",
};

type RoomWebViewProps = {
  roomId: string;
  token: string;
  provider: "netflix" | "prime" | "youtube";
  isHost: boolean;
  movieTitle?: string | null;
  initialVideoUrl?: string | null;
  onVideoUrlUpdated?: (url: string) => void;
};

function WebViewFallback({ provider }: { provider: "netflix" | "prime" | "youtube" }) {
  const { theme } = useUnistyles();
  const url = STREAMING_BASE_URLS[provider] ?? STREAMING_BASE_URLS.netflix;

  return (
    <View style={[styles.fallback, { backgroundColor: theme.color.background }]}>
      <Typography variant="body" weight="medium" color={theme.color.textMuted} style={{ textAlign: "center", marginBottom: 8 }}>
        In-app streaming needs a native build. If you opened this via Expo Go, that app does not include WebView.
      </Typography>
      <Typography variant="smallBody" color={theme.color.textMuted} style={{ textAlign: "center", marginBottom: 16 }}>
        Build and install once: connect your phone, run "npx expo run:android", then open this project from the installed app (not Expo Go).
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
  provider,
  isHost,
  movieTitle,
  initialVideoUrl,
  onVideoUrlUpdated,
}: RoomWebViewProps) {
  const webViewRef = useRef<any>(null);
  const defaultUrl = STREAMING_BASE_URLS[provider] ?? STREAMING_BASE_URLS.netflix;
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
    console.log("[RoomWebView] navigation", { url: currentUrl, provider, isHost });
    if (isHost) {
      const isNetflixWatch = currentUrl.includes("netflix.com/watch/");
      const isPrimeWatch = currentUrl.includes("primevideo.com") && (currentUrl.includes("/watch/") || currentUrl.includes("/gp/video/"));
      const isYoutubeWatch = currentUrl.includes("youtube.com/watch?v=");
      if (isNetflixWatch || isPrimeWatch || isYoutubeWatch) {
        console.log("[RoomWebView] detected watch URL, saving to room");
        updateRoomVideoUrl(roomId, currentUrl, token).then(() => {
          onVideoUrlUpdated?.(currentUrl);
        }).catch(() => {});
      }
    }
  };

  const handleWebBack = () => {
    webViewRef.current?.goBack?.();
    console.log("[RoomWebView] webview goBack");
  };

  const handleSearchAgain = () => {
    console.log("[RoomWebView] host requested search again");
    onVideoUrlUpdated?.("");
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    const raw = event.nativeEvent.data;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.type === "string") {
        console.log("[RoomWebView] player event", {
          type: parsed.type,
          currentTime: parsed.currentTime,
          duration: parsed.duration,
          paused: parsed.paused,
          url: parsed.url,
          provider,
          isHost,
        });
        // TODO: host-only: write play/pause/seek state to Firebase RTDB for real-time sync
      } else {
        console.log("[RoomWebView] onMessage (unknown payload)", raw);
      }
    } catch {
      console.log("[RoomWebView] onMessage (non-JSON)", raw);
    }
  };

  if (!WebView) {
    return <WebViewFallback provider={provider} />;
  }

  return (
    <View style={styles.container}>
      {isHost && (
        <View style={styles.controlsBar}>
          <Pressable style={styles.controlButton} onPress={handleWebBack}>
            <Typography variant="smallBody" weight="medium">
              Back
            </Typography>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={handleSearchAgain}>
            <Typography variant="smallBody" weight="medium">
              Search again
            </Typography>
          </Pressable>
        </View>
      )}
      {useYouTubeEmbed && youTubeVideoId ? (
        <WebView
          ref={webViewRef}
          source={{
            html: `<!DOCTYPE html>
  <html>
    <body style="margin:0;background-color:#000;">
      <div id="player"></div>
      <script src="https://www.youtube.com/iframe_api"></script>
      <script>
        var player;
        function onYouTubeIframeAPIReady() {
          player = new YT.Player('player', {
            videoId: '${youTubeVideoId}',
            playerVars: { controls: 1, rel: 0, modestBranding: 1, playsinline: 1 },
            events: {
              onStateChange: function(e) {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'yt_state',
                    state: e.data,
                    currentTime: player.getCurrentTime(),
                    duration: player.getDuration()
                  }));
                }
              }
            }
          });
        }
      </script>
    </body>
  </html>`,
          }}
          onMessage={handleMessage}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: initialUrl }}
          injectedJavaScript={INJECT_PLAYER_LISTENERS}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          scalesPageToFit
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  controlsBar: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: "row",
    gap: 8,
  },
  controlButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  openBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
