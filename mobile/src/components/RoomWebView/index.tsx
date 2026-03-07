import React, { useRef, useCallback, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import Typography from "@/src/components/common/Typography";
import { updateRoomPlayback } from "@/src/services/rooms";
import type { WebViewMessageEvent } from "react-native-webview";

let WebView: any = null;
try {
  WebView = require("react-native-webview").WebView;
} catch {
  // WebView native module not available (e.g. Expo Go).
}

const WEBVIEW_HEIGHT = 250;

const VIMEO_EMBED_HTML = (videoId: string, showControls: boolean) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: black; overflow: hidden; }
    iframe { width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body>
  <iframe
    id="vimeo-player"
    src="https://player.vimeo.com/video/${videoId}?controls=${showControls ? 1 : 0}&title=0&byline=0&portrait=0"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
  ></iframe>

  <script src="https://player.vimeo.com/api/player.js"></script>
  <script>
    (function() {
      var iframe = document.getElementById('vimeo-player');
      var player = new Vimeo.Player(iframe);
      function post(type, data) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data || {} }));
        }
      }
      player.on('play', function() { post('play'); });
      player.on('pause', function() { post('pause'); });
      player.on('seeked', function() { post('seeked'); });
      player.on('timeupdate', function(e) { post('timeupdate', { seconds: e.seconds }); });
      player.on('ended', function() { post('ended'); });
      player.on('error', function(e) { post('error', e); });
    })();
  </script>
</body>
</html>
`;

type RoomWebViewProps = {
  roomId: string;
  token: string;
  isHost: boolean;
  videoUrl: string | null;
  onProgressUpdated?: (progress: number) => void;
};

function WebViewFallback() {
  const { theme } = useUnistyles();
  return (
    <View style={[styles.fallback, { backgroundColor: theme.color.background }]}>
      <Typography variant="body" weight="medium" color={theme.color.textMuted} style={{ textAlign: "center" }}>
        In-app video needs a native build. Run "npx expo run:android" and open from the installed app.
      </Typography>
    </View>
  );
}

export default function RoomWebView({
  roomId,
  token,
  isHost,
  videoUrl,
  onProgressUpdated,
}: RoomWebViewProps) {
  const webViewRef = useRef<any>(null);
  const [httpError, setHttpError] = useState<string | null>(null);

  const rawId = videoUrl?.trim() || "";
  const cleanVideoId = String(rawId).replace(/\D/g, "");
  const html = cleanVideoId ? VIMEO_EMBED_HTML(cleanVideoId, isHost) : null;

  console.log("[RoomWebView] render", {
    roomId,
    isHost,
    videoUrl,
    cleanVideoId,
    hasHtml: !!html,
  });

  const reportProgress = useCallback(
    (progress: number) => {
      if (!isHost) return;
      updateRoomPlayback(roomId, { progress }, token).catch(() => {});
      onProgressUpdated?.(progress);
    },
    [roomId, token, isHost, onProgressUpdated]
  );

  const reportCompleted = useCallback(() => {
    if (!isHost) return;
    updateRoomPlayback(roomId, { isCompleted: true }, token).catch(() => {});
  }, [roomId, token, isHost]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const raw = event.nativeEvent.data;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.type !== "string") return;
      const type = parsed.type as string;
      if (type === "timeupdate" && parsed.data?.seconds != null && isHost) {
        reportProgress(Math.floor(parsed.data.seconds));
      }
      if (type === "ended" && isHost) {
        reportCompleted();
      }
      if (type === "error") {
        console.warn("[RoomWebView] Vimeo player error", parsed.data);
        setHttpError("This video cannot be played in the app. Try another one.");
      }
    } catch {
      // ignore
    }
  };

  if (!WebView) {
    return <WebViewFallback />;
  }

  if (!html) {
    return (
      <View style={[styles.placeholder, styles.webviewFixed]}>
        <Typography variant="body" color="#666">
          No video set or invalid video. Start a party from the lobby.
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {httpError && (
        <View style={[styles.webviewFixed, styles.errorOverlay]}>
          <Text style={styles.errorText}>{httpError}</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{
          html,
          baseUrl: "https://vimeo.com",
          headers: {
            Referer: "https://vimeo.com/",
          },
        }}
        onMessage={handleMessage}
        style={styles.webviewFixed}
        androidLayerType="hardware"
        mixedContentMode="always"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(event: any) => {
          const { nativeEvent } = event;
          console.warn("[RoomWebView] WebView error", nativeEvent);
          setHttpError(`WebView error: ${nativeEvent?.description || "Unknown error"}`);
        }}
        onHttpError={(event: any) => {
          const { nativeEvent } = event;
          console.warn("[RoomWebView] WebView HTTP error", nativeEvent);
          const status = nativeEvent?.statusCode;
          const desc = nativeEvent?.description || "HTTP error";
          setHttpError(`Video cannot be embedded (HTTP ${status} ${desc}). Try another video.`);
        }}
        renderError={(errorName: string) => (
          <View style={[styles.webviewFixed, styles.errorContainer]}>
            <Text style={styles.errorText}>WebView Error: {errorName}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  webviewFixed: {
    width: "100%",
    height: WEBVIEW_HEIGHT,
  },
  placeholder: {
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  fallback: {
    height: WEBVIEW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#330000",
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  errorText: {
    color: "#ff5555",
    fontSize: 14,
    textAlign: "center",
  },
});
