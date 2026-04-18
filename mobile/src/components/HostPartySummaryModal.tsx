import React, { useCallback } from "react";
import { View, Image, Modal, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import Typography from "@/src/components/common/Typography";
import Button from "@/src/components/common/Button";
import { avatars } from "@/src/utils/dummyData";
import type { RoomParticipant } from "@/src/services/rooms";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  roomName: string;
  roomDescription: string;
  movieImageUrl?: string;
  participants: RoomParticipant[];
  summaryDurationSec: number;
  hostDisplayName?: string;
  hostAvatarKey?: string;
};

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function HostPartySummaryModal({
  visible,
  onDismiss,
  roomName,
  roomDescription,
  movieImageUrl,
  participants,
  summaryDurationSec,
  hostDisplayName,
  hostAvatarKey,
}: Props) {
  const getAvatarSource = useCallback((avatarKey?: string) => {
    const id = avatarKey ? parseInt(avatarKey, 10) : NaN;
    const fallback = avatars[0]?.url;
    if (Number.isNaN(id)) return fallback;
    const found = avatars.find((a) => a.id === id);
    return found?.url ?? fallback;
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.summaryOverlay}>
        <View style={styles.summaryWrap}>
          <Pressable style={styles.summaryCloseBtn} onPress={onDismiss}>
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
                <Image source={getAvatarSource(hostAvatarKey)} style={styles.hostAvatar} />
                <Typography variant="smallBody" weight="medium">
                  {hostDisplayName ?? "Host"} (You)
                </Typography>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Typography variant="smallBody" color="#A9A9B2">Watched by:</Typography>
              <View style={styles.watchedByRow}>
                {participants.slice(0, 4).map((p, idx) => (
                  <View key={p.userId} style={[styles.watcherAvatarWrap, { marginLeft: idx === 0 ? 0 : -10 }]}>
                    <Image source={getAvatarSource(p.avatar)} style={styles.watcherAvatar} />
                  </View>
                ))}
                {participants.length > 4 && (
                  <View style={[styles.watcherAvatarWrap, styles.extraWatcherBadge, { marginLeft: -10 }]}>
                    <Typography variant="caption" weight="bold" color="#fff">
                      +{participants.length - 4}
                    </Typography>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Typography variant="smallBody" color="#A9A9B2">Lasted for:</Typography>
              <Typography variant="smallBody" weight="medium">{formatDuration(summaryDurationSec)}</Typography>
            </View>
          </View>

          <View style={{ marginTop: 14, width: "100%" }}>
            <Button title="host-another-party" onPress={onDismiss}>
              Host another party
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create(() => ({
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
