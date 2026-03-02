import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { styles } from "./styles";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppLogo } from "@/src/assets/svgs";
import Button from "@/src/components/common/Button";
import Typography from "@/src/components/common/Typography";
import { selectProviderData } from "@/src/utils/dummyData";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { updateStreamingProvider } from "@/src/services/user";

const SelectProvider = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token, setStreamingProvider, user } = useAuth();

  useEffect(() => {
    if (user?.streamingProvider) {
      const match = selectProviderData.find((p) => p.providerId === user.streamingProvider);
      if (match) setSelectedId(match.id);
    }
  }, [user?.streamingProvider]);

  console.log("[SelectProvider] render", { selectedId, loading, streamingProvider: user?.streamingProvider });

  const handleContinue = async () => {
    const selected = selectProviderData.find((p) => p.id === selectedId);
    if (!selected || !token) {
      console.log("[SelectProvider] handleContinue: no selection or token", { selectedId, hasToken: !!token });
      return;
    }
    console.log("[SelectProvider] handleContinue: saving provider", selected.providerId);
    setLoading(true);
    try {
      await updateStreamingProvider(token, selected.providerId);
      setStreamingProvider(selected.providerId);
      console.log("[SelectProvider] handleContinue: saved, navigating to home");
      router.push("/(tabs)/home");
    } catch (e: any) {
      console.error("[SelectProvider] handleContinue error:", e);
      Alert.alert("Error", e?.message ?? "Failed to save streaming provider.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View style={styles.headerContainer}>
          <View style={styles.logoWrapper}>
            <AppLogo />
          </View>
          <Typography variant="subHeading" weight="medium">
            syncwatch
          </Typography>
        </View>
        <View style={styles.typographyContainer}>
          <Typography variant="h2" weight="bold">
            Select a streaming service.
          </Typography>
          <Typography variant="body" weight="medium">
            We’ll open it in sync for everyone.
          </Typography>
        </View>
        <View style={styles.streamServicesContainer}>
          {selectProviderData.map((item) => {
            return (
              <Pressable
                key={item.id}
                style={styles.provider}
                onPress={() => {
                  setSelectedId(item.id);
                }}
              >
                <View style={styles.logoFrame}>
                  <View style={styles.logo}>{item.logo}</View>
                  <Typography variant="body" weight="medium">
                    {item.title}
                  </Typography>
                </View>
                <View
                  style={[
                    styles.dot,
                    selectedId === item.id && styles.dotActive,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <Button
        disabled={selectedId === null || loading}
        title="selectProvider"
        onPress={handleContinue}
      >
        {loading ? "Saving..." : "Continue to homepage"}
      </Button>
    </SafeAreaView>
  );
};
export default SelectProvider;
