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
import { fetchYouTubeHomepage, searchYouTubeVideos } from "@/src/services/youtube";
import { createRoom } from "@/src/services/rooms";
import { Details, Form, Success } from "./CreateParty";
import Typography from "@/src/components/common/Typography";
import { useAuth } from "@/src/context/AuthContext";
import { useUnistyles } from "react-native-unistyles";

function youtubeToMovieProps(v: { id: string; title: string; thumbnailUri: string; description: string; videoId: string }): MovieProps {
  return {
    id: v.id,
    title: v.title,
    image: v.thumbnailUri ? { uri: v.thumbnailUri } : require("@/src/assets/images/image1.jpg"),
    description: v.description || undefined,
    embedUrl: v.videoId,
  };
}

function Home() {
  const { theme } = useUnistyles();
  const [stage, setStage] = useState<Stages>("details");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieProps | null>(null);
  const [movies, setMovies] = useState<MovieProps[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MovieProps[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<
    import("@/src/services/rooms").Room | null
  >(null);
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchYouTubeHomepage()
      .then(({ items, nextPageToken: token }) => {
        if (!cancelled) {
          const mapped = items.map(youtubeToMovieProps);
          setMovies(mapped);
          setNextPageToken(token);
          setHasMore(!!token);
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
      searchYouTubeVideos(trimmed, { maxResults: 20 })
        .then(({ items }) => {
          if (!cancelled) setSearchResults(items.map(youtubeToMovieProps));
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

  const handleMoviePress = (movie: MovieProps) => {
    setSelectedMovie(movie);
    setModalVisible(true);
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
    const videoId = selectedMovie?.embedUrl ?? (typeof selectedMovie?.id === "string" ? selectedMovie.id : undefined);
    const room = await createRoom(
      {
        name,
        description: description.trim(),
        movieTitle: selectedMovie?.title,
        movieImageUrl: getMovieImageUrl(selectedMovie),
        videoId: videoId || undefined,
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
    setLoadingMore(true);
    fetchYouTubeHomepage(nextPageToken)
      .then(({ items, nextPageToken: token }) => {
        const mapped = items.map(youtubeToMovieProps);
        if (mapped.length === 0) {
          setHasMore(false);
          return;
        }
        setMovies((prev) => [...prev, ...mapped]);
        setNextPageToken(token);
        setHasMore(!!token);
      })
      .catch(() => setHasMore(false))
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
    </SafeAreaView>
  );
}
export default Home;
