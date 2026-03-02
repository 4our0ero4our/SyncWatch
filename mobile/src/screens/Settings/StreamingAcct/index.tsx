import React, { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { View, Pressable, ScrollView } from "react-native";

import { styles } from "./styles";
import StackHeader from "@/src/components/StackHeader";
import Typography from "@/src/components/common/Typography";
import { selectProviderData } from "@/src/utils/dummyData";
import { useAuth } from "@/src/context/AuthContext";
import { updateStreamingProvider } from "@/src/services/user";

export default function StreamingAccountsScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const { user, token, setStreamingProvider } = useAuth();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const currentProvider = user?.streamingProvider;

  const handleBack = () => {
    router.back();
  };

  const handlePlatformPress = async (item: (typeof selectProviderData)[0]) => {
    if (currentProvider === item.providerId) {
      console.log("[StreamingAccounts] already selected:", item.providerId);
      return;
    }
    if (!token) {
      console.log("[StreamingAccounts] no token");
      Alert.alert("Error", "You must be logged in to change your streaming provider.");
      return;
    }
    console.log("[StreamingAccounts] handlePlatformPress: saving", item.providerId);
    setLoadingId(item.id);
    try {
      await updateStreamingProvider(token, item.providerId);
      setStreamingProvider(item.providerId);
      console.log("[StreamingAccounts] handlePlatformPress: saved", item.providerId);
    } catch (e: any) {
      console.error("[StreamingAccounts] handlePlatformPress error:", e);
      Alert.alert("Error", e?.message ?? "Failed to update streaming provider.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StackHeader handleBack={() => handleBack()} title="Streaming Accounts" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.descriptionContainer}>
          <Typography variant="smallBody" weight="medium">
            See all your connected streaming platforms.
          </Typography>
        </View>

        <View style={styles.platformsList}>
          {selectProviderData.map((item) => {
            const isActive = currentProvider === item.providerId;
            const isLoading = loadingId === item.id;
            return (
              <Pressable
                key={item.id}
                style={styles.platformItem}
                onPress={() => handlePlatformPress(item)}
                disabled={isLoading}
              >
                <View style={styles.platformLeft}>
                  <View>{item.logo}</View>
                  <Typography variant="body" weight="medium">
                    {item.title}
                  </Typography>
                </View>

                {isActive && (
                  <View style={styles.activeBadge}>
                    <Typography
                      variant="caption"
                      weight="medium"
                      color={theme.color.white}
                    >
                      Active
                    </Typography>
                  </View>
                )}
                {isLoading && (
                  <Typography variant="caption" weight="medium" color={theme.color.textMuted}>
                    Saving...
                  </Typography>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
