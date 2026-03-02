import React from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { styles } from "../styles";
import { CreatePartyProps } from "../types";
import Button from "@/src/components/common/Button";
import Typography from "@/src/components/common/Typography";
import { LeftBanner, RightBanner } from "@/src/assets/svgs";
import ClipboardCopy from "@/src/components/clipBoard/index";

export const Success = ({
  onClose,
  createdRoom,
}: CreatePartyProps) => {
  const router = useRouter();

  const handleGoToParty = () => {
    onClose();
    if (createdRoom?.id) {
      router.push({ pathname: "/party-lobby", params: { roomId: createdRoom.id } });
    }
  };

  if (!createdRoom) {
    return (
      <ScrollView>
        <View style={styles.createdPartysection}>
          <Typography variant="body" weight="regular">
            Loading...
          </Typography>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView>
      <View style={styles.createdPartysection}>
        <Typography align="center" variant="body" weight="regular">
          You’ve created your watch party:
        </Typography>
        <View style={styles.bannerCard}>
          <View style={styles.bannerLeft}>
            <RightBanner />
          </View>
          <Typography variant="subHeading" weight="bold">
            {createdRoom.name}
          </Typography>
          <Typography variant="smallerBody" weight="medium">
            {createdRoom.description || "No description"}
          </Typography>
          <View style={styles.bannerRight}>
            <LeftBanner />
          </View>
        </View>
        <View>
          <ClipboardCopy
            text={createdRoom.inviteCode}
            label="Share invite code"
          />
        </View>
        <Button title="go-to-party" onPress={handleGoToParty}>
          Go to Party
        </Button>
      </View>
    </ScrollView>
  );
};
