import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, Pressable, Alert } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { styles } from "./styles";
import Header from "@/src/components/TabHeader";
import MovieModal from "@/src/components/Modal";
import Input from "@/src/components/common/Input";
import PartyCard from "@/src/components/PartyCard";
import CustomTab from "@/src/components/CustomTabs";
import Typography from "@/src/components/common/Typography";
import Button from "@/src/components/common/Button";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { getMyRooms, getRoomByInviteCode, type Room } from "@/src/services/rooms";
import { pastParties } from "@/src/utils/dummyData";

const tabOptions = [
  { label: "Current parties", value: "Current" },
  { label: "Past parties", value: "Ended" },
];

/**
 * Formats a room date to a string.
 * @param isoDate - The ISO date string to format.
 * @returns The formatted date string.
 */
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

/**
 * Converts a room to a party card item.
 * @param room - The room to convert.
 * @returns The party card item.
 */
function roomToPartyCardItem(room: Room) {
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
  };
}

export default function PartiesScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const { token } = useAuth();
  const [selectedTab, setSelectedTab] = useState("Current");
  const [modalVisible, setModalVisible] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setRooms([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      getMyRooms(token)
        .then(setRooms)
        .catch(() => setRooms([]))
        .finally(() => setLoading(false));
    }, [token])
  );

  const currentPartiesData = rooms.map(roomToPartyCardItem);

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleJoinParty = () => {
    setModalVisible(true);
  };

  const handleJoinWithCode = async () => {
    const code = joinCode.trim();
    if (!code || !token) {
      console.log("[Parties] handleJoinWithCode: no code or token");
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
      Alert.alert("Room not found", "Invalid invite code. Please check and try again.");
    } finally {
      setJoinLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ReturnType<typeof roomToPartyCardItem> }) => (
    <PartyCard
      id={item.id}
      title={item.title}
      description={item.description}
      date={item.date}
      movieImage={item.movieImage}
      movieTitle={item.movieTitle}
      participants={item.participants}
      status={item.status}
      onPress={() => router.push({ pathname: "/party-lobby", params: { roomId: item.id } })}
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
                <Typography variant="body" weight="regular" color={theme.color.textMuted}>
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
          data={pastParties as unknown as Array<{ id: string; title: string; description: string; date: string; movieImage: any; movieTitle: string; participants: { id: string; name: string; color: string }[]; status: "Current" }>}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Typography
                variant="body"
                weight="regular"
                color={theme.color.textMuted}
              >
                No {selectedTab} parties yet
              </Typography>
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
    </SafeAreaView>
  );
}
