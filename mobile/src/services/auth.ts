import { GoogleSignin } from "@react-native-google-signin/google-signin";
import auth from "@react-native-firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL, AUTH_LOGIN_PATH } from "@/src/config/api";

type BackendUser = {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  streamingProvider?: "netflix" | "prime" | "youtube";
};

type BackendLoginResponse = {
  token: string;
  user: BackendUser;
};

/**
 * Signs the user in with Google, links it with Firebase Auth to obtain
 * a Firebase ID token, then logs in against the backend /api/auth/login route.
 */
export async function loginWithGoogleProvider(): Promise<BackendLoginResponse> {
  console.log("[auth] loginWithGoogleProvider: start");
  try {
    console.log("[auth] Checking Google Play Services...");
    const hasPlayServices = await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    console.log("[auth] hasPlayServices:", hasPlayServices);

    console.log("[auth] Calling GoogleSignin.signIn()...");
    await GoogleSignin.signIn();
    console.log("[auth] GoogleSignin.signIn() resolved");

    console.log("[auth] Fetching current Google user...");
    const currentUser = await GoogleSignin.getCurrentUser();
    console.log("[auth] currentUser:", currentUser);
    if (!currentUser?.idToken) {
      throw new Error("Google Sign-In failed: missing idToken");
    }

    console.log("[auth] Creating Firebase Google credential...");
    const googleCredential = auth.GoogleAuthProvider.credential(
      currentUser.idToken
    );

    console.log("[auth] Signing into Firebase with credential...");
    const userCredential = await auth().signInWithCredential(googleCredential);
    console.log("[auth] Firebase userCredential.user:", userCredential.user?.toJSON?.() ?? userCredential.user);

    console.log("[auth] Getting Firebase ID token...");
    const firebaseIdToken = await userCredential.user.getIdToken();
    console.log("[auth] Firebase ID token (truncated):", firebaseIdToken.slice(0, 20), "...");

    console.log("[auth] Calling backend login endpoint:", `${API_BASE_URL}${AUTH_LOGIN_PATH}`);
    const res = await fetch(`${API_BASE_URL}${AUTH_LOGIN_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken: firebaseIdToken,
        provider: "google",
      }),
    });

    console.log("[auth] Backend response status:", res.status, res.statusText);
    if (!res.ok) {
      const message = await res.text();
      console.error("[auth] Backend login error body:", message);
      throw new Error(
        `Backend login failed (${res.status} ${res.statusText}): ${message}`
      );
    }

    const data = (await res.json()) as BackendLoginResponse;
    console.log("[auth] Backend login success, data:", data);
    return data;
  } catch (err) {
    console.error("[auth] loginWithGoogleProvider error:", err);
    throw err;
  }
}

/**
 * Signs out from Firebase and Google, and clears stored auth data.
 * Call this together with AuthContext.logout() to fully log the user out.
 */
export async function logout(): Promise<void> {
  try {
    await auth().signOut();
    await GoogleSignin.signOut();
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("user");
  } catch (e) {
    console.warn("[auth] logout error:", e);
  }
}
