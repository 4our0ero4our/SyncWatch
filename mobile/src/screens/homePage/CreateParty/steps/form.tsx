import React, { useState } from "react";
import { View, Image, ScrollView } from "react-native";

import { styles } from "../styles";
import Typography from "@/src/components/common/Typography";
import Input from "@/src/components/common/Input";
import Button from "@/src/components/common/Button";
import { CreatePartyProps } from "../types";

export const Form = ({
  onClose,
  movie,
  handleCreateParty,
  onCreateRoom,
}: CreatePartyProps) => {
  const [partyName, setPartyName] = useState("");
  const [partyDescription, setPartyDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInvite = async () => {
    const name = partyName.trim();
    console.log("[Form] handleGenerateInvite", { name, description: partyDescription });
    if (!name) {
      setError("Please enter a party name.");
      return;
    }
    if (!onCreateRoom) {
      handleCreateParty();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onCreateRoom(name, partyDescription.trim());
      console.log("[Form] handleGenerateInvite: success");
    } catch (e: any) {
      setError(e?.message ?? "Failed to create party. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <View style={styles.description}>
        <View style={styles.banner}>
          <Image
            resizeMode="cover"
            source={movie?.image}
            style={styles.bannerImg}
          />
        </View>
        <View>
          <Typography variant="body" weight="regular">
            You’re about to create a Watch Party for
          </Typography>
          <Typography variant="smallBody" weight="bold">
            {movie?.title}
          </Typography>
        </View>
      </View>
      <View style={styles.formContainer}>
        <Input
          placeholder="Enter a name"
          label="Set party name"
          value={partyName}
          onChangeText={setPartyName}
          editable={!loading}
        />
        <Input
          placeholder="Describe your watch party"
          label="Enter a description (optional)"
          value={partyDescription}
          onChangeText={setPartyDescription}
          editable={!loading}
        />
        {error ? (
          <Typography variant="caption" weight="regular" style={styles.formError}>
            {error}
          </Typography>
        ) : null}
        <Button
          onPress={handleGenerateInvite}
          title="generate invite"
          disabled={loading}
        >
          {loading ? "Creating..." : "Generate invite"}
        </Button>
      </View>
    </ScrollView>
  );
};
