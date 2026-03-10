import React from "react";
import { useUnistyles } from "react-native-unistyles";
import { View, Pressable, Image } from "react-native";

import { styles } from "./styles";
import { PartyCardProps } from "./types";
import Typography from "@/src/components/common/Typography";

const PartyCard: React.FC<PartyCardProps> = ({
  id,
  title,
  description,
  date,
  movieImage,
  movieTitle,
  participants,
  status,
  isPlaying,
  onPress,
}) => {
  const { theme } = useUnistyles();

  const handlePress = () => {
    if (onPress) onPress();
  };

  const getStatusLabel = () => {
    switch (status) {
      case "Current":
        return isPlaying ? "Playing" : "Upcoming";
      case "Ended":
        return "Ended";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "Current":
        return theme.color.primary;
      case "Ended":
        return theme.color.secondary;
    }
  };

  const visibleParticipants = participants.slice(0, 2);
  const remainingCount = participants.length - 2;
  const isEnded = status === "Ended";

  const content = (
    <View style={styles.content}>
        <View style={styles.posterContainer}>
          <Image
            source={movieImage}
            style={styles.poster}
            resizeMode="cover"
          />
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
          >
            <Typography
              variant="caption"
              weight="medium"
              color={theme.color.white}
            >
              {getStatusLabel()}
            </Typography>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View>
            <Typography variant="subHeading" weight="xxBold">
              {title}
            </Typography>
            <Typography
              variant="smallBody"
              weight="medium"
              color={theme.color.textMuted}
            >
              {description}
            </Typography>
          </View>

          <View style={styles.footer}>
            <Typography
              variant="caption"
              weight="medium"
              color={theme.color.textMuted}
            >
              {date}
            </Typography>

            <View style={styles.participants}>
              {visibleParticipants.map((participant, index) => (
                <View
                  key={participant.id}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: participant.color,
                      marginLeft: index > 0 ? -8 : 0,
                      zIndex: visibleParticipants.length - index,
                    },
                  ]}
                >
                  {participant.avatar ? (
                    <Image
                      source={{ uri: participant.avatar }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Typography
                      variant="smallerBody"
                      weight="regular"
                      color={theme.color.white}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </Typography>
                  )}
                </View>
              ))}

              {remainingCount > 0 && (
                <View
                  style={[
                    styles.avatar,
                    styles.remainingAvatar,
                    { marginLeft: -8, zIndex: 0 },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="medium"
                    align="center"
                    color={theme.color.background}
                  >
                    +{remainingCount}
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </View>
    </View>
  );

  if (isEnded) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={handlePress}
    >
      {content}
    </Pressable>
  );
};

export default PartyCard;
