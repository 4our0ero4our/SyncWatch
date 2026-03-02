import "@/src/utils/unistyles.config";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  DMSans_900Black,
} from "@expo-google-fonts/dm-sans";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { AuthProvider } from "@/src/context/AuthContext";

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const [loaded, error] = useFonts({
    "DM-Sans": DMSans_400Regular,
    "DM-Sans-Medium": DMSans_500Medium,
    "DM-Sans-SemiBold": DMSans_600SemiBold,
    "DM-Sans-Bold": DMSans_700Bold,
    "DM-Sans-ExtraBold": DMSans_800ExtraBold,
    DMSans_xxBold: DMSans_900Black,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Configure Google Sign-In once on app start
  useEffect(() => {
    console.log(
      "[RootStack] Configuring GoogleSignin with webClientId:",
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    );
    GoogleSignin.configure({
      // Set this to your Firebase Web client ID.
      // Prefer setting via EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID env variable.
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  if (!loaded && !error) {
    return null;
  }
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="select-provider"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="party-lobby"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="room-webview"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ gestureEnabled: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <RootStack />
    </AuthProvider>
  );
}
