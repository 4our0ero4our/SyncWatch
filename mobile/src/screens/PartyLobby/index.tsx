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
import { getRoom, type Room } from "@/src/services/rooms";

const PartyLobbyScreen = () => {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { token } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

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
            <Button title="go-to-party" onPress={handleGoToParty}>
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
}));
