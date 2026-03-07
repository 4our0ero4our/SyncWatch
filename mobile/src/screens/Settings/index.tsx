import React, { useState } from "react";
import { View, Pressable, Switch, ScrollView, Image } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "./styles";
import Typography from "@/src/components/common/Typography";
import {
  AccountIcon,
  HelpCenterIcon,
  LogoutIcon,
  NextPageIcon,
  ProfileIcon,
  PushNoticationIcon,
} from "@/src/assets/svgs";
import { useRouter } from "expo-router";
import LogoutModal from "@/src/components/LogoutModal";
import { avatars } from "@/src/utils/dummyData";
import { useAuth } from "@/src/context/AuthContext";
import { logout as authLogout } from "@/src/services/auth";

export default function SettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const router = useRouter();

  const { theme } = useUnistyles();
  const { user, isAuthenticated, logout } = useAuth();

  console.log("[SettingsScreen] render, isAuthenticated:", isAuthenticated);
  console.log("[SettingsScreen] user:", user);

  const handlePress = (item: string) => {
    console.log(`Pressed: ${item}`);
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutModalVisible(false);
    await authLogout();
    logout();
    router.replace("/");
  };

  const handleLogoutCancel = () => {
    setLogoutModalVisible(false);
  };
  const getAvatarSource = (avatarKey?: string) => {
    const id = avatarKey ? parseInt(avatarKey, 10) : NaN;
    const fallback = avatars[0]?.url;
    if (Number.isNaN(id)) return fallback;
    const found = avatars.find((a) => a.id === id);
    return found?.url ?? fallback;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={getAvatarSource(user?.avatar)} style={styles.avatar} />
          </View>
          <Typography variant="subHeading" weight="semibold">
            {user?.displayName ?? "Guest"}
          </Typography>
          <Typography
            variant="smallBody"
            weight="medium"
            color={theme.color.textMuted}
          >
            {user?.email ?? "guest@example.com"}
          </Typography>
        </View>

        <View style={styles.section}>
          <Typography
            variant="smallBody"
            weight="regular"
            color={theme.color.textMuted}
            style={styles.sectionTitle}
          >
            Account
          </Typography>

          <View style={styles.menuGroup}>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/(tabs)/settings/edit-profile")}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconWrapper}>
                  <Typography variant="body">
                    <ProfileIcon
                      width={20}
                      height={20}
                      color={theme.color.textMuted}
                    />
                  </Typography>
                </View>
                <Typography variant="body" weight="medium">
                  Personal Info
                </Typography>
              </View>
              <NextPageIcon />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/(tabs)/settings/streaming-accounts")}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconWrapper}>
                  <Typography variant="body">
                    <AccountIcon />
                  </Typography>
                </View>
                <Typography variant="body" weight="medium">
                  Streaming Accounts
                </Typography>
              </View>
              <NextPageIcon />
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.iconWrapper}>
                  <Typography variant="body">
                    <PushNoticationIcon
                      width={20}
                      height={20}
                      color={theme.color.textMuted}
                    />
                  </Typography>
                </View>
                <Typography variant="body" weight="medium">
                  Push Notifications
                </Typography>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{
                  false: theme.color.gray02,
                  true: theme.color.background,
                }}
                thumbColor={theme.color.white}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Typography
            variant="smallBody"
            weight="medium"
            color={theme.color.textMuted}
            style={styles.sectionTitle}
          >
            Support
          </Typography>

          <View style={styles.menuGroup}>
            <Pressable
              style={styles.menuItem}
              onPress={() => handlePress("Security & Help Center")}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconWrapper}>
                  <Typography variant="body">
                    <HelpCenterIcon
                      width={20}
                      height={20}
                      color={theme.color.textMuted}
                    />
                  </Typography>
                </View>
                <Typography variant="body" weight="medium">
                  Security & Help Center
                </Typography>
              </View>
              <NextPageIcon />
            </Pressable>
            <View style={styles.divider} />

            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuLeft}>
                <View style={styles.iconWrapper}>
                  <LogoutIcon
                    width={20}
                    height={20}
                    color={theme.color.error}
                  />
                </View>
                <Typography variant="body" weight="medium">
                  Logout
                </Typography>
              </View>
              <NextPageIcon />
            </Pressable>
          </View>
          <LogoutModal
            visible={logoutModalVisible}
            onClose={handleLogoutCancel}
            onConfirm={handleLogoutConfirm}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
