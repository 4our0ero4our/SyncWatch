import React, { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native-unistyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Pressable, ScrollView, Image } from "react-native";

import Input from "@/src/components/common/Input";
import Button from "@/src/components/common/Button";
import Typography from "@/src/components/common/Typography";
import { avatars } from "@/src/utils/dummyData";
import StackHeader from "@/src/components/StackHeader";
import { useAuth } from "@/src/context/AuthContext";
import { updateProfile } from "@/src/services/user";
import { Alert } from "react-native";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, token, login } = useAuth();

  const initialAvatarId = useMemo(() => {
    if (!user?.avatar) return 1;
    const parsed = parseInt(user.avatar, 10);
    return Number.isNaN(parsed) ? 1 : parsed;
  }, [user?.avatar]);

  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatarId);
  const [name, setName] = useState(user?.displayName ?? "");
  const email = user?.email ?? "";
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !token) {
      router.back();
      return;
    }
    const trimmed = name.trim();
    const updates: { displayName?: string; avatar?: string } = {};
    if (trimmed && trimmed !== user.displayName) {
      updates.displayName = trimmed;
    }
    const currentAvatarId = user.avatar ? parseInt(user.avatar, 10) : undefined;
    if (!Number.isNaN(selectedAvatar) && selectedAvatar !== currentAvatarId) {
      updates.avatar = String(selectedAvatar);
    }
    if (!updates.displayName && !updates.avatar) {
      router.back();
      return;
    }
    try {
      setSaving(true);
      const updated = await updateProfile(token, updates);
      login({
        user: {
          ...user,
          displayName: updated.displayName,
          avatar: updated.avatar,
        },
        token,
      });
      console.log("[EditProfileScreen] profile updated:", {
        displayName: updated.displayName,
        avatar: updated.avatar,
      });
      router.back();
    } catch (e: any) {
      console.error("[EditProfileScreen] handleSave error:", e);
      Alert.alert("Error", e?.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StackHeader handleBack={() => handleBack()} title="Edit Profile" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.descriptionContainer}>
          <Typography variant="smallBody" weight="medium">
            Select an avatar and update your display name. Your email is fixed.
          </Typography>
        </View>
        <View style={styles.avatarGrid}>
          {avatars.map((avatar) => (
            <Pressable
              key={avatar.id}
              style={[
                styles.avatarContainer,
                selectedAvatar === avatar.id && styles.avatarSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar.id)}
            >
              <Image source={avatar.url} style={styles.avatar} />
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              variant="secondary"
            />
            <Input
              label="Email"
              value={email}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              variant="secondary"
              editable={false}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button title="save changes" variant="primary" onPress={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.color.background,
    paddingHorizontal: theme.spacing.m,
  },
  descriptionContainer: {
    paddingTop: theme.spacing.m,
    paddingBottom: theme.spacing.l,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 4,
    backgroundColor: theme.color.backgroundLight,
  },
  avatarSelected: {
    backgroundColor: theme.color.primary,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },
  form: {
    gap: theme.spacing.l,
  },
  inputGroup: {
    gap: theme.spacing.s,
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  buttonContainer: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
}));
