import React, { useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { styles } from "./styles";
import Button from "@/src/components/common/Button";
import { GoogleLogo, AppleLogo } from "@/src/assets/svgs";
import OnboardingSlides from "@/src/components/OnboardingSlide";
import { onboardingData } from "../../utils/dummyData";
import { loginWithGoogleProvider } from "@/src/services/auth";
import { useAuth } from "@/src/context/AuthContext";

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  console.log("[Onboarding] render, isAuthenticated:", isAuthenticated);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { token, user } = await loginWithGoogleProvider();
      console.log("[Onboarding] Logged in user:", user);
      console.log("[Onboarding] Session token:", token);

      // Save in context so other screens can read the auth state
      login({ token, user });

      // Also persist to AsyncStorage for debugging / future bootstrap
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      console.log("[Onboarding] Auth data stored, navigating to select-provider");
      router.navigate("/select-provider");
    } catch (err: any) {
      console.error("[Onboarding] Google login error", err);
      Alert.alert(
        "Login failed",
        err?.message ?? "Unable to login with Google. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingSlides
        slides={onboardingData}
        autoSlideInterval={3000} // 3 seconds
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        onSlideChange={(index) => index}
      />
      <View style={styles.bottomSection}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.dotActive]}
            />
          ))}
        </View>
        <View style={styles.buttonGroup}>
          {loading && (
            <ActivityIndicator size="large" color="#FF007B" style={{ marginBottom: 8 }} />
          )}
          <Button
            title="appleLogo"
            icon={<AppleLogo width={20} height={20} />}
            variant="primary"
          >
            Continue with Apple
          </Button>

          <Button
            title="googleLogo"
            icon={<GoogleLogo width={20} height={20} />}
            variant="secondary"
            disabled={loading}
            onPress={loginWithGoogle}
          >
            {loading ? "Signing in..." : "Continue with Google"}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
