import {StyleSheet} from 'react-native-unistyles'

export const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.color.background,
    paddingHorizontal: theme.spacing.s,
    paddingBottom: rt.insets.bottom,
  },
  searchSection: {
    flex: 1,
    justifyContent: "center",
  },
  searchesWrapper: {
    paddingBottom: theme.spacing.m,
  },
  movieSection: {
    flex: 3.5,
  },
  gridContent: {
    paddingVertical: theme.spacing.s,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: theme.spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 280,
  },
  searchLoadingText: {
    marginTop: theme.spacing.m,
  },
  errorText: {
    textAlign: "center",
    paddingHorizontal: theme.spacing.m,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.l,
    minHeight: 200,
  },
  emptyStateTitle: {
    textAlign: "center",
    marginBottom: theme.spacing.s,
  },
  emptyStateMessage: {
    textAlign: "center",
  },
  movieCard: {
    height: 100,
    width: 190,
    borderRadius: theme.radius.m,
    overflow: "hidden",
  },
  movieCardDisabled: {
    opacity: 0.7,
  },
  movieCardOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  movieImage: {
    width: "100%",
    height: "100%",
  },
}));
