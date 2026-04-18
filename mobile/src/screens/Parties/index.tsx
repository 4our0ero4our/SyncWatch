import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, FlatList, Pressable, Alert } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { styles } from "./styles";
import Header from "@/src/components/TabHeader";
import MovieModal from "@/src/components/Modal";
import Input from "@/src/components/common/Input";
import PartyCard from "@/src/components/PartyCard";
import { PartyCardProps } from "@/src/components/PartyCard/types";
import CustomTab from "@/src/components/CustomTabs";
import Typography from "@/src/components/common/Typography";
import Button from "@/src/components/common/Button";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import HostPartySummaryModal from "@/src/components/HostPartySummaryModal";
import {
  getMyRooms,
  getRoomByInviteCode,
  getRoom,
  getParticipants,
  type Room,
  type RoomParticipant,
} from "@/src/services/rooms";
import { takeHostPartySummaryIntent } from "@/src/utils/hostPartySummaryIntent";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

const tabOptions = [
  { label: "Current parties", value: "Current" },
  { label: "Past parties", value: "Ended" },
];

type PartyCardItem = Omit<PartyCardProps, "onPress">;

function formatRoomDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function roomToPartyCardItem(room: Room): PartyCardItem {
  return {
    id: room.id,
    title: room.name,
    description: room.description || "",
    date: formatRoomDate(room.createdAt),
    movieImage: room.movieImageUrl
      ? { uri: room.movieImageUrl }
      : require("@/src/assets/images/image1.jpg"),
    movieTitle: room.movieTitle || "Movie",
    participants: [] as { id: string; name: string; color: string }[],
    status: "Current" as const,
    isPlaying: room.isPlaying ?? false,
  };
}

export default function PartiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    partySummary?: string;
    summaryRoomId?: string;
    summaryDurationSec?: string;
  }>();
  const { theme } = useUnistyles();
  const { token, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("Current");
  const [modalVisible, setModalVisible] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pastRooms, setPastRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [hostSummaryOpen, setHostSummaryOpen] = useState(false);
  const [hostSummaryPayload, setHostSummaryPayload] = useState({
    roomName: "Watch Party",
    roomDescription: "",
    movieImageUrl: undefined as string | undefined,
    participants: [] as RoomParticipant[],
    durationSec: 0,
  });
  const summaryLoadKeyRef = useRef<string | null>(null);
  const dismissedSummaryKeyRef = useRef<string | null>(null);
  const summaryOpenInFlightRef = useRef(false);

  const pSummary = firstParam(params.partySummary);
  const pRoomId = firstParam(params.summaryRoomId);
  const pDur = firstParam(params.summaryDurationSec);

  const dismissHostSummary = useCallback(() => {
    const shown = summaryLoadKeyRef.current;
    if (shown) dismissedSummaryKeyRef.current = shown;
    summaryLoadKeyRef.current = null;
    setHostSummaryOpen(false);
    router.replace({ pathname: "/(tabs)/parties" });
  }, [router]);

  const openHostSummaryForRoom = useCallback(
    async (summaryRoomId: string, durationSec: number) => {
      if (!token) return;
      const key = `${summaryRoomId}:${durationSec}`;
      if (summaryLoadKeyRef.current === key) return;
      if (dismissedSummaryKeyRef.current === key) return;
      if (summaryOpenInFlightRef.current) return;
      summaryOpenInFlightRef.current = true;

      setSelectedTab("Ended");
      try {
        const [room, participants] = await Promise.all([
          getRoom(summaryRoomId, token),
          getParticipants(summaryRoomId, token),
        ]);
        summaryLoadKeyRef.current = key;
        setHostSummaryPayload({
          roomName: room.name || "Watch Party",
          roomDescription: room.description || "",
          movieImageUrl: room.movieImageUrl || undefined,
          participants,
          durationSec,
        });
        setHostSummaryOpen(true);
      } catch (e) {
        console.error("[Parties] host summary load failed", e);
        summaryLoadKeyRef.current = null;
        router.replace({ pathname: "/(tabs)/parties" });
      } finally {
        summaryOpenInFlightRef.current = false;
      }
    },
    [token, router],
  );

  useEffect(() => {
    if (pSummary !== "1" || !pRoomId || !token) {
      dismissedSummaryKeyRef.current = null;
      return;
    }
    const durationSec = Math.max(0, Math.floor(parseInt(pDur ?? "0", 10) || 0));
    void openHostSummaryForRoom(pRoomId, durationSec);
  }, [pSummary, pRoomId, pDur, token, openHostSummaryForRoom]);

  useFocusEffect(
    useCallback(() => {
      const pending = takeHostPartySummaryIntent();
      if (pending && token) {
        void openHostSummaryForRoom(pending.roomId, pending.durationSec);
      }
      if (!token) {
        setRooms([]);
        setPastRooms([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      Promise.all([
        getMyRooms(token, false),
        getMyRooms(token, true),
      ])
        .then(([current, past]) => {
          setRooms(current);
          setPastRooms(past);
        })
        .catch(() => {
          setRooms([]);
          setPastRooms([]);
        })
        .finally(() => setLoading(false));
    }, [token, openHostSummaryForRoom]),
  );

  const currentPartiesData: PartyCardItem[] = rooms.map(roomToPartyCardItem);
  const pastPartiesData: PartyCardItem[] = pastRooms.map((room) => ({
    ...roomToPartyCardItem(room),
    status: "Ended",
  }));

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleJoinParty = () => {
    setModalVisible(true);
  };

  const handleJoinWithCode = async () => {
    const code = joinCode.trim();
    if (!code || !token) {
      console.log("[Parties] handleJoinWithCode: no code or token", {
        hasCode: code.length > 0,
        hasToken: !!token,
      });
      if (!token) {
        Alert.alert("Session expired", "Please sign in again to join a party.");
      }
      return;
    }
    console.log("[Parties] handleJoinWithCode: looking up", code);
    setJoinLoading(true);
    try {
      const room = await getRoomByInviteCode(code, token);
      setModalVisible(false);
      setJoinCode("");
      console.log("[Parties] handleJoinWithCode: found room", room.id);
      router.push({ pathname: "/party-lobby", params: { roomId: room.id } });
    } catch (e) {
      console.error("[Parties] handleJoinWithCode: failed", e);
      Alert.alert(
        "Room not found",
        "Invalid invite code. Please check and try again.",
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const renderItem = ({
    item,
  }: {
    item: ReturnType<typeof roomToPartyCardItem>;
  }) => (
    <PartyCard
      id={item.id}
      title={item.title}
      description={item.description}
      date={item.date}
      movieImage={item.movieImage}
      movieTitle={item.movieTitle}
      participants={item.participants}
      status={item.status}
      onPress={() =>
        router.push({ pathname: "/party-lobby", params: { roomId: item.id } })
      }
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Header
          title="Parties"
          description="See all the parties you’ve created."
        />
      </View>
      <View style={styles.tabContainer}>
        <CustomTab
          options={tabOptions}
          selectedValue={selectedTab}
          onValueChange={setSelectedTab}
        />
      </View>
      {selectedTab === "Current" && (
        <FlatList
          data={currentPartiesData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {loading ? (
                <Typography
                  variant="body"
                  weight="regular"
                  color={theme.color.textMuted}
                >
                  Loading...
                </Typography>
              ) : (
                <Typography
                  variant="body"
                  weight="regular"
                  color={theme.color.textMuted}
                >
                  No current parties yet. Create one from Home!
                </Typography>
              )}
            </View>
          }
        />
      )}
      {selectedTab === "Ended" && (
        <FlatList
          data={pastPartiesData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {loading ? (
                <Typography variant="body" weight="regular" color={theme.color.textMuted}>
                  Loading...
                </Typography>
              ) : (
                <Typography variant="body" weight="regular" color={theme.color.textMuted}>
                  No past parties yet
                </Typography>
              )}
            </View>
          }
        />
      )}
      <View style={styles.stickyButtonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.joinButton,
            pressed && styles.joinButtonPressed,
          ]}
          onPress={handleJoinParty}
        >
          <Typography
            align="center"
            variant="h2"
            weight="bold"
            color={theme.color.white}
          >
            +
          </Typography>
          <Typography
            align="center"
            variant="body"
            weight="medium"
            color={theme.color.white}
          >
            Join a party
          </Typography>
        </Pressable>
      </View>
      <MovieModal visible={modalVisible} onClose={handleCloseModal}>
        <View style={styles.joinPartySection}>
          <Typography weight="semibold" variant="subHeading" align="center">
            Join a watch party
          </Typography>
          <Input
            label="Enter invite code"
            placeholder="6-digit invite code"
            value={joinCode}
            onChangeText={setJoinCode}
          />
          <View style={styles.ButtonWrapper}>
            <Button
              onPress={handleJoinWithCode}
              title="Go to party"
              disabled={!joinCode.trim() || joinLoading}
            >
              {joinLoading ? "Joining..." : "Go to party"}
            </Button>
          </View>
        </View>
      </MovieModal>
      <HostPartySummaryModal
        visible={hostSummaryOpen}
        onDismiss={dismissHostSummary}
        roomName={hostSummaryPayload.roomName}
        roomDescription={hostSummaryPayload.roomDescription}
        movieImageUrl={hostSummaryPayload.movieImageUrl}
        participants={hostSummaryPayload.participants}
        summaryDurationSec={hostSummaryPayload.durationSec}
        hostDisplayName={user?.displayName}
        hostAvatarKey={user?.avatar}
      />
    </SafeAreaView>
  );
}
