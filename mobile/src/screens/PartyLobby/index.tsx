import { StyleSheet } from "react-native-unistyles";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import StackHeader from "@/src/components/StackHeader";
import { Image, View, ActivityIndicator } from "react-native";
import Typography from "@/src/components/common/Typography";
import ClipboardCopy from "@/src/components/clipBoard/index";
import { useRouter, useLocalSearchParams } from "expo-router";
import Button from "@/src/components/common/Button";
import { useAuth } from "@/src/context/AuthContext";
import {
  getRoom,
  getWaitingUsers,
  joinWaitingRoom,
  leaveWaitingRoom,
  type Room,
  type WaitingUser,
} from "@/src/services/rooms";
import { avatars } from "@/src/utils/dummyData";

const PartyLobbyScreen = () => {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { token, user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const getAvatarSource = (avatarKey?: string) => {
    const id = avatarKey ? parseInt(avatarKey, 10) : NaN;
    const fallback = avatars[0]?.url;
    if (Number.isNaN(id)) return fallback;
    const found = avatars.find((a) => a.id === id);
    return found?.url ?? fallback;
  };

  useEffect(() => {
    if (!roomId || !token) {
      setLoading(false);
      return;
    }
    console.log("[PartyLobby] fetching room", roomId);
    getRoom(roomId, token)
      .then((r) => {
        setRoom(r);
        console.log("[PartyLobby] room loaded", r.name);
      })
      .catch((e) => {
        console.error("[PartyLobby] failed to load room", e);
      })
      .finally(() => setLoading(false));
  }, [roomId, token]);

  useEffect(() => {
    if (!roomId || !token || !room) return;
    const id = setInterval(() => {
      getRoom(roomId, token)
        .then(setRoom)
        .catch(() => {});
      getWaitingUsers(roomId, token)
        .then(setWaitingUsers)
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [roomId, token, room]);

  useEffect(() => {
    if (!roomId || !token || !room) return;
    const isHost = user?.id === room.hostId;
    const isEnded = room.isCompleted === true;
    const hostLive = room.hostSessionActive === true;

    if (isHost || isEnded || hostLive) {
      leaveWaitingRoom(roomId, token).catch(() => {});
      return;
    }

    joinWaitingRoom(roomId, token).catch(() => {});
    const heartbeat = setInterval(() => {
      joinWaitingRoom(roomId, token).catch(() => {});
    }, 10000);

    return () => {
      clearInterval(heartbeat);
      leaveWaitingRoom(roomId, token).catch(() => {});
    };
  }, [roomId, token, room?.hostId, room?.isCompleted, room?.hostSessionActive, user?.id]);

  const handleGoToParty = () => {
    console.log("[PartyLobby] Go to Party pressed", roomId);
    router.push({ pathname: "/room-webview", params: { roomId: roomId ?? "" } });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StackHeader handleBack={() => router.back()} title="Party Lobby" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StackHeader handleBack={() => router.back()} title="Party Lobby" />
        <View style={styles.loadingContainer}>
          <Typography variant="body" weight="medium">
            Room not found
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  const movieImage = room.movieImageUrl
    ? { uri: room.movieImageUrl }
    : require("../../assets/images/image9.png");

  const isEnded = room.isCompleted === true;
  const isHostUser = user?.id === room.hostId;
  const hostLive = room.hostSessionActive === true;
  const visitorCanEnter = isHostUser || hostLive;
  const waitingUsersExcludingSelf = waitingUsers.filter((w) => w.userId !== user?.id);
  const visibleWaiting = waitingUsersExcludingSelf.slice(0, 4);
  const waitingExtra = waitingUsersExcludingSelf.length - visibleWaiting.length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <StackHeader handleBack={() => router.back()} title="Party Lobby" />
      </View>
      <View style={styles.sections}>
        <View style={styles.contentWrapper}>
          <View style={styles.description}>
            <Typography variant="subHeading" weight="bold">
              {room.name}
            </Typography>
            <Typography variant="smallerBody" weight="medium">
              {room.description || "No description"}
            </Typography>
          </View>
          <View style={styles.content}>
            <View style={styles.imgWrapper}>
              <Image style={styles.img} source={movieImage} resizeMode="cover" />
            </View>
            {!isEnded && (
              <View style={styles.clipBoard}>
                <ClipboardCopy
                  label="Share invite code to more people"
                  text={room.inviteCode}
                  style={styles.clip}
                  align="center"
                />
              </View>
            )}
          </View>
        </View>
        {!isEnded && (
          <View style={styles.footer}>
            {visibleWaiting.length > 0 && (
              <View style={styles.waitingRow}>
                <View style={styles.waitingAvatars}>
                  {visibleWaiting.map((w, idx) => (
                    <View key={w.userId} style={[styles.waitingAvatarWrap, { marginLeft: idx === 0 ? 0 : -10 }]}>
                      <Image source={getAvatarSource(w.avatar)} style={styles.waitingAvatar} />
                    </View>
                  ))}
                  {waitingExtra > 0 && (
                    <View style={[styles.waitingAvatarWrap, styles.waitingExtraBadge, { marginLeft: -10 }]}>
                      <Typography variant="caption" weight="bold" color="#fff">
                        +{waitingExtra}
                      </Typography>
                    </View>
                  )}
                </View>
                <Typography variant="smallBody" weight="medium">
                  are waiting...
                </Typography>
              </View>
            )}
            {!isHostUser && !hostLive && (
              <Typography variant="smallBody" weight="medium" style={{ marginBottom: 8, textAlign: "center" }}>
                Waiting for the host to open the watch room…
              </Typography>
            )}
            <Button
              title="go-to-party"
              onPress={handleGoToParty}
              disabled={!visitorCanEnter}
            >
              Go to Party
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default PartyLobbyScreen;

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.color.background,
    paddingHorizontal: theme.spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flex: 1,
  },
  sections: {
    flex: 4.5,
    alignItems: "center",
    justifyContent:"space-between"
  },
  description: {
    alignItems: "center",
    justifyContent: "center",

    paddingVertical: theme.spacing.m,
  },
  contentWrapper: {},
  content: {
    width: 320,
    // height: 314,
    backgroundColor: theme.color.backgroundLight,
    borderRadius: theme.radius.l,
    padding: theme.spacing.m,
    alignItems: "center",
  },
  imgWrapper: {
    width: 280,
    height: 158,
  },
  img: {
    width: "100%",
    height: "100%",
  },
  clipBoard: {
    width: "100%",
    paddingBottom: theme.spacing.m,

    paddingTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.m,
    backgroundColor: theme.color.background,
    marginTop: theme.spacing.m,
    borderRadius: theme.spacing.m,
  },
  clip: {
    backgroundColor: theme.color.backgroundLight,
    alignItems: "center",
  },
  footer: {
    width:"100%",
    marginBottom:theme.spacing.l
  },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 120,
  },
  waitingAvatars: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 6,
  },
  waitingAvatarWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#0B0B0F",
    backgroundColor: "#1B1E28",
    alignItems: "center",
    justifyContent: "center",
  },
  waitingAvatar: {
    width: "100%",
    height: "100%",
  },
  waitingExtraBadge: {
    backgroundColor: "#0E9BFF",
  },
}));
