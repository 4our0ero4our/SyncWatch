import React from "react";
import { View, Modal, Pressable } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import Typography from "@/src/components/common/Typography";
import Button from "@/src/components/common/Button";
import { CloseIcon } from "@/src/assets/svgs";
import { styles } from "./styles";

type AlertModalProps = {
  visible: boolean;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) => {
  const { theme } = useUnistyles();

  const handleSecondary = () => {
    onSecondary?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSecondary}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleSecondary} />

        <View style={styles.modalContainer}>
          <Pressable style={styles.closeButton} onPress={handleSecondary}>
            <View style={styles.closeIconWrapper}>
              <CloseIcon width={19} height={19} />
            </View>
          </Pressable>

          <View style={styles.content}>
            <Typography
              align="center"
              variant="body"
              weight="medium"
              style={styles.message}
            >
              {message}
            </Typography>
            <View style={styles.buttonGroup}>
              {secondaryLabel ? (
                <View style={styles.buttonWrapper}>
                  <Button
                    color={theme.color.background}
                    title="secondary"
                    variant="netural"
                    onPress={handleSecondary}
                  >
                    {secondaryLabel}
                  </Button>
                </View>
              ) : null}
              <View style={styles.buttonWrapper}>
                <Button
                  variant="tertiary"
                  onPress={onPrimary}
                  title="primary"
                >
                  {primaryLabel}
                </Button>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;

