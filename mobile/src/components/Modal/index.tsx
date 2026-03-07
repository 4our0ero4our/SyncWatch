import React from "react";
import {
  View,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CustomModalProps } from "./types";
import { styles } from "./styles";
import { CloseIcon } from "@/src/assets/svgs";

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  children,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end" }}
          behavior="padding"
          keyboardVerticalOffset={40}
        >
          <View style={styles.modalContainer}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <View style={styles.closeIconWrapper}>
                <CloseIcon />
              </View>
            </Pressable>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default CustomModal;
