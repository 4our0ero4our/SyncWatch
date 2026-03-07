import React from "react";
import { View, Image, ScrollView } from "react-native";

import { styles } from "../styles";
import Typography from "@/src/components/common/Typography";
import Button from "@/src/components/common/Button";
import { CreatePartyProps } from "../types";

export const Details = ({
  onClose,
  movie,
  handleCreateParty,
}: CreatePartyProps) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.posterContainer}>
        {movie?.image && (
          <Image
            source={movie.image}
            style={styles.poster}
            resizeMode="cover"
          />
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.rankBadge}>
          <View style={styles.rank}>
            <Typography variant="smallerBody" weight="xxBold">
              TOP
            </Typography>
            <Typography variant="caption" weight="xxBold">
              10
            </Typography>
          </View>
          <Typography variant="body" weight="bold">
            {movie?.title}
          </Typography>
        </View>
        <Typography variant="smallBody" weight="medium">
          {movie?.description}
        </Typography>
        <View style={styles.buttonContainer}>
          <Button
            title="create party"
            variant="primary"
            onPress={handleCreateParty}
          >
            Create watch party
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};
