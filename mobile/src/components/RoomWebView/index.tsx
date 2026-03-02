import React from "react";
import { View, StyleSheet, Pressable, Linking } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import Typography from "@/src/components/common/Typography";
import { updateRoomVideoUrl } from "@/src/services/rooms";

let WebView: React.ComponentType<{
  source: { uri: string };
  onNavigationStateChange?: (navState: { url: string }) => void;
  style?: object;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  startInLoadingState?: boolean;
  scalesPageToFit?: boolean;
}> | null = null;

try {
  WebView = require("react-native-webview").WebView;
} catch {
  // WebView native module not available (e.g. Expo Go). Use fallback.
}

const STREAMING_BASE_URLS: Record<string, string> = {
  netflix: "https://www.netflix.com",
  prime: "https://www.primevideo.com",
};

type RoomWebViewProps = {
  roomId: string;
  token: string;
  provider: "netflix" | "prime";
  isHost: boolean;
  movieTitle?: string | null;
  initialVideoUrl?: string | null;
  onVideoUrlUpdated?: (url: string) => void;
};

function WebViewFallback({ provider }: { provider: "netflix" | "prime" }) {
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
  const defaultUrl = STREAMING_BASE_URLS[provider] ?? STREAMING_BASE_URLS.netflix;
  const trimmedVideoUrl = initialVideoUrl?.trim() ?? "";
  const trimmedTitle = movieTitle?.trim() ?? "";

  let initialUrl = defaultUrl;
  if (trimmedVideoUrl.length > 0) {
    initialUrl = trimmedVideoUrl;
  } else if (trimmedTitle.length > 0) {
    const q = encodeURIComponent(trimmedTitle);
    if (provider === "netflix") {
      initialUrl = `${defaultUrl}/search?q=${q}`;
    } else if (provider === "prime") {
      initialUrl = `${defaultUrl}/search?phrase=${q}`;
    }
  }

  const handleNavigationStateChange = (navState: { url: string }) => {
    const currentUrl = navState.url;
    if (isHost) {
      const isNetflixWatch = currentUrl.includes("netflix.com/watch/");
      const isPrimeWatch = currentUrl.includes("primevideo.com") && (currentUrl.includes("/watch/") || currentUrl.includes("/gp/video/"));
      const isYoutubeWatch = currentUrl.includes("youtube.com/watch?v=");
      if (isNetflixWatch || isPrimeWatch || isYoutubeWatch) {
        updateRoomVideoUrl(roomId, currentUrl, token).then(() => {
          onVideoUrlUpdated?.(currentUrl);
        }).catch(() => {});
      }
    }
  };

  if (!WebView) {
    return <WebViewFallback provider={provider} />;
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: initialUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
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
