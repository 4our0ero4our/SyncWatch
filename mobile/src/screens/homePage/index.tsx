import { styles } from "./styles";
import React, { useState, useEffect } from "react";
import {
  View,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Stages } from "./types";
import Header from "../../components/TabHeader";
import { SearchIcon } from "@/src/assets/svgs";
import MovieModal from "@/src/components/Modal";
import Input from "@/src/components/common/Input";
import { MovieProps } from "../homePage/CreateParty/types";
import {
  fetchPopularMoviesForProvider,
  fetchSearchMovies,
  isMovieOnProvider,
} from "@/src/services/tmdb";
import { createRoom } from "@/src/services/rooms";
import { Details, Form, Success } from "./CreateParty";
import Typography from "@/src/components/common/Typography";
import { useAuth } from "@/src/context/AuthContext";
import { useUnistyles } from "react-native-unistyles";
import AlertModal from "@/src/components/AlertModal";

function vimeoToMovieProps(v: { id: string; title: string; thumbnailUri: string; description: string; embedUrl: string }): MovieProps {
  return {
    id: v.id,
    title: v.title,
    image: v.thumbnailUri ? { uri: v.thumbnailUri } : require("@/src/assets/images/image1.jpg"),
    description: v.description || undefined,
    embedUrl: v.embedUrl,
  };
}

function Home() {
  const { theme } = useUnistyles();
  const [stage, setStage] = useState<Stages>("details");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieProps | null>(null);
  const [movies, setMovies] = useState<MovieProps[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MovieProps[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [checkingMovieId, setCheckingMovieId] = useState<number | null>(null);
  const [createdRoom, setCreatedRoom] = useState<
    import("@/src/services/rooms").Room | null
  >(null);
  const { user, token } = useAuth();
  const router = useRouter();

  const [alertState, setAlertState] = useState<{
    message: string;
    primaryLabel: string;
    onPrimary: () => void;
    secondaryLabel?: string;
    onSecondary?: () => void;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVimeoVideosHomepage(1, 20)
      .then((list) => {
        if (!cancelled) {
          const mapped = list.map(vimeoToMovieProps);
          setMovies(mapped);
          setPage(1);
          setHasMore(mapped.length > 0);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Failed to load videos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      searchVimeoVideos(trimmed, 1, 20)
        .then((list) => {
          if (!cancelled) setSearchResults(list.map(vimeoToMovieProps));
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const displayMovies = searchQuery.trim() ? searchResults : movies;
  const isSearchActive = searchQuery.trim().length > 0;
  const showEmptyState =
    isSearchActive && !searchLoading && displayMovies.length === 0;

  const handleCloseModal = () => {
    setModalVisible(false);
    setStage("details");
    setTimeout(() => {
      setSelectedMovie(null);
      setCreatedRoom(null);
    }, 300);
  };

  /**
   * Handles the movie press event. Checks if user has a streaming provider and if the movie
   * is available on that platform before opening the create party modal.
   */
  const handleMoviePress = async (movie: MovieProps) => {
    const provider = user?.streamingProvider;
    if (!provider) {
      setAlertState({
        message: "Please select your streaming provider in Settings first.",
        primaryLabel: "Go to Settings",
        onPrimary: () => {
          setAlertState(null);
          router.push("/(tabs)/settings");
        },
        secondaryLabel: "OK",
        onSecondary: () => setAlertState(null),
      });
      return;
    }

    setCheckingMovieId(movie.id);
    try {
      const available = await isMovieOnProvider(movie.id, provider);
      if (!available) {
        const providerLabel =
          provider === "netflix" ? "Netflix" : "Prime Video";
        setAlertState({
          message: `"${movie.title}" isn't available on ${providerLabel}. Change your streaming provider in Settings?`,
          primaryLabel: "Change in Settings",
          onPrimary: () => {
            setAlertState(null);
            router.push("/(tabs)/settings");
          },
          secondaryLabel: "Cancel",
          onSecondary: () => setAlertState(null),
        });
        return;
      }
      setSelectedMovie(movie);
      setModalVisible(true);
    } catch {
      setAlertState({
        message: "Could not check availability. Please try again.",
        primaryLabel: "OK",
        onPrimary: () => setAlertState(null),
      });
    } finally {
      setCheckingMovieId(null);
    }
  };

  const handleCreateParty = () => {
    if (stage === "details") {
      setStage("form");
    } else if (stage === "form") {
      setStage("success");
    }
  };

  const getMovieImageUrl = (movie: MovieProps | null): string | undefined => {
    if (!movie?.image) return undefined;
    if (
      typeof movie.image === "object" &&
      "uri" in movie.image &&
      typeof movie.image.uri === "string"
    ) {
      return movie.image.uri;
    }
    return undefined;
  };

  const handleCreateRoom = async (name: string, description: string) => {
    if (!token) throw new Error("You must be logged in to create a party.");
    const videoUrl = selectedMovie?.embedUrl;
    const room = await createRoom(
      {
        name,
        description: description || undefined,
        movieTitle: selectedMovie?.title,
        movieImageUrl: getMovieImageUrl(selectedMovie),
        videoUrl: videoUrl || undefined,
      },
      token,
    );
    setCreatedRoom(room);
    setStage("success");
  };

  const renderItem = ({ item }: { item: MovieProps }) => (
    <Pressable
      style={styles.movieCard}
      onPress={() => handleMoviePress(item)}
    >
      <Image
        source={typeof item.image === "object" && "uri" in item.image ? item.image : require("@/src/assets/images/image1.jpg")}
        style={styles.movieImage}
        resizeMode="cover"
      />
    </Pressable>
  );

  const handleLoadMore = () => {
    if (isSearchActive || loadingMore || !hasMore || loading) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchVimeoVideosHomepage(nextPage, 20)
      .then((list) => {
        const mapped = list.map(vimeoToMovieProps);
        if (mapped.length === 0) {
          setHasMore(false);
          return;
        }
        setMovies((prev) => [...prev, ...mapped]);
        setPage(nextPage);
      })
      .catch(() => {
        // keep previous data, just stop endless loading on error
        setHasMore(false);
      })
      .finally(() => setLoadingMore(false));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchSection}>
          <Header
            title={`Hi, ${user?.displayName}`}
            description="Pick something to watch together."
          />
          <Input
            variant="secondary"
            placeholder="Search movies or shows"
            leftIcon={<SearchIcon />}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={[styles.movieSection, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchSection}>
        <Header
          title={`Hi, ${user?.displayName}`}
          description="Pick something to watch together."
        />
        <Input
          variant="secondary"
          placeholder="Search movies or shows"
          leftIcon={<SearchIcon />}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.movieSection}>
        {error ? (
          <View style={styles.loadingContainer}>
            <Typography
              variant="smallBody"
              weight="medium"
              color={theme.color.error}
              style={styles.errorText}
            >
              {error}
            </Typography>
          </View>
        ) : (
          <>
            <View style={styles.searchesWrapper}>
              <Typography variant="body" weight="medium">
                {isSearchActive ? "Search results" : "Top Searches"}
              </Typography>
            </View>
            {searchLoading && isSearchActive ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color="#E50914" />
                <Typography
                  variant="smallBody"
                  weight="medium"
                  color={theme.color.textMuted}
                  style={styles.searchLoadingText}
                >
                  Searching...
                </Typography>
              </View>
            ) : showEmptyState ? (
              <View style={styles.emptyStateContainer}>
                <Typography
                  variant="body"
                  weight="medium"
                  style={styles.emptyStateTitle}
                >
                  No videos found
                </Typography>
                <Typography
                  variant="smallBody"
                  weight="regular"
                  color={theme.color.textMuted}
                  style={styles.emptyStateMessage}
                >
                  Try a different search term.
                </Typography>
              </View>
            ) : (
              <FlatList
                data={displayMovies}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                numColumns={2}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  !isSearchActive && loadingMore ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#E50914" />
                    </View>
                  ) : null
                }
              />
            )}
          </>
        )}
      </View>
      <MovieModal visible={modalVisible} onClose={handleCloseModal}>
        {stage === "details" && (
          <Details
            handleCreateParty={handleCreateParty}
            onClose={handleCloseModal}
            movie={selectedMovie}
          />
        )}
        {stage === "form" && (
          <Form
            handleCreateParty={handleCreateParty}
            onClose={handleCloseModal}
            movie={selectedMovie}
            onCreateRoom={handleCreateRoom}
          />
        )}
        {stage === "success" && (
          <Success
            handleCreateParty={handleCreateParty}
            onClose={handleCloseModal}
            movie={selectedMovie}
            createdRoom={createdRoom}
          />
        )}
      </MovieModal>
      <AlertModal
        visible={!!alertState}
        message={alertState?.message ?? ""}
        primaryLabel={alertState?.primaryLabel ?? ""}
        onPrimary={alertState?.onPrimary ?? (() => setAlertState(null))}
        secondaryLabel={alertState?.secondaryLabel}
        onSecondary={alertState?.onSecondary}
      />
    </SafeAreaView>
  );
}
export default Home;
