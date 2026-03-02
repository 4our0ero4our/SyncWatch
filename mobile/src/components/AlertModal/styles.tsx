import { StyleSheet } from "react-native-unistyles";

export const styles = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.l,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: theme.color.backgroundLight,
    borderRadius: theme.radius.l,
    width: "100%",
    maxWidth: 400,
    padding: theme.spacing.l,
  },
  closeButton: {
    position: "absolute",
    top: theme.spacing.m,
    right: theme.spacing.m,
    zIndex: 10,
  },
  closeIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingTop: theme.spacing.m,
    gap: theme.spacing.m,
  },
  message: {
    paddingVertical: theme.spacing.l,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonWrapper: {
    width: "48%",
  },
}));

