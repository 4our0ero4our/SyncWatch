import { StyleSheet } from "react-native-unistyles";

export const styles = StyleSheet.create((theme) => ({
  // details
  posterContainer: {
    width: "100%",
    height: 192,
    overflow: "hidden",
    borderRadius: theme.radius.m,
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  content: {
    gap: theme.spacing.l,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s,
    paddingTop: theme.spacing.m,
  },
  rank: {
    alignItems: "center",
    backgroundColor: theme.color.abstract,
    borderRadius: theme.radius.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  buttonContainer: {
    marginBottom: theme.spacing.m,
  },

  // form
  description: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: theme.spacing.s,
  },
  banner: {
    width: 78,
    height: 44,
  },
  bannerImg: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.xs,
  },

  formContainer: {
    gap: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  formError: {
    color: theme.color.error,
  },

  // success
  createdPartysection: {
    gap: 12,
    marginBottom: 20,
  },
  bannerCard: {
    height: 80,
    borderRadius: theme.radius.l,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.color.background,
  },
  bannerLeft: {
    position: "absolute",
    right: 1,
    bottom: 1,
  },
  bannerRight: {
    position: "absolute",
    left: 1,
    bottom: 1,
  },
}));
