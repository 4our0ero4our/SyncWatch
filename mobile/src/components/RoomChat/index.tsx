import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useUnistyles } from "react-native-unistyles";
import Typography from "@/src/components/common/Typography";
import { getMessages, sendMessage, type ChatMessage } from "@/src/services/chat";
import { getParticipants, type RoomParticipant } from "@/src/services/rooms";
import { avatars } from "@/src/utils/dummyData";

const REACTIONS = ["👍", "😂", "❤️", "😮", "😢", "🔥"];

function getAvatarSource(avatarKey?: string) {
  const id = avatarKey ? parseInt(avatarKey, 10) : NaN;
  const fallback = avatars[0]?.url;
  if (Number.isNaN(id)) return fallback;
  const found = avatars.find((a) => a.id === id);
  return found?.url ?? fallback;
}

type RoomChatProps = {
  roomId: string;
  token: string;
};

export default function RoomChat({ roomId, token }: RoomChatProps) {
  const { theme } = useUnistyles();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const list = await getMessages(roomId, token);
      setMessages(list.reverse());
    } catch (e) {
      console.error("[RoomChat] fetchMessages error", e);
    } finally {
      setLoading(false);
    }
  }, [roomId, token]);

  const fetchParticipants = useCallback(async () => {
    try {
      const list = await getParticipants(roomId, token);
      setParticipants(list);
    } catch {
      // ignore
    }
  }, [roomId, token]);

  useEffect(() => {
    fetchMessages();
    fetchParticipants();
    const interval = setInterval(() => {
      fetchMessages();
      fetchParticipants();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchParticipants]);

  const handleSendText = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      const msg = await sendMessage(roomId, token, "text", text);
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      console.error("[RoomChat] send text error", e);
    }
  };

  const handleSendReaction = async (emoji: string) => {
    try {
      const msg = await sendMessage(roomId, token, "reaction", emoji);
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      console.error("[RoomChat] send reaction error", e);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const displayName = item.displayName ?? item.userId.slice(0, 12) + (item.userId.length > 12 ? "…" : "");
    const avatarSource = getAvatarSource(item.avatar);
    return (
      <View style={styles.messageRow}>
        <Image source={avatarSource} style={styles.messageAvatar} />
        <View style={styles.messageBubble}>
          {item.type === "text" ? (
            <Typography variant="smallBody" weight="regular">
              <Typography variant="caption" weight="medium" color={theme.color.textMuted}>
                {displayName}
              </Typography>{" "}
              {item.content}
            </Typography>
          ) : (
            <Typography variant="smallBody" weight="medium">
              <Typography variant="caption" weight="medium" color={theme.color.textMuted}>
                {displayName}
              </Typography>{" "}
              reacted {item.content}
            </Typography>
          )}
        </View>
      </View>
    );
  };

  const visibleParticipants = participants.slice(0, 4);
  const extraCount = participants.length - visibleParticipants.length;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.color.backgroundLight }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={[styles.header, { borderBottomColor: "rgba(255,255,255,0.1)" }]}>
        <Typography variant="body" weight="bold">
          Live Messages
        </Typography>
        <View style={styles.participantAvatars}>
          {visibleParticipants.map((p, index) => (
            <View
              key={p.userId}
              style={[
                styles.participantAvatarWrap,
                { backgroundColor: theme.color.primary, marginLeft: index > 0 ? -8 : 0, zIndex: visibleParticipants.length - index },
              ]}
            >
              <Image source={getAvatarSource(p.avatar)} style={styles.participantAvatar} />
            </View>
          ))}
          {extraCount > 0 && (
            <View style={[styles.participantAvatarWrap, styles.extraAvatar, { marginLeft: -8, zIndex: 0 }]}>
              <Typography variant="caption" weight="medium" color={theme.color.background}>
                +{extraCount}
              </Typography>
            </View>
          )}
        </View>
      </View>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, messages.length === 0 && styles.listEmpty]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? null : (
            <Typography variant="smallBody" color={theme.color.textMuted} style={styles.emptyText}>
              No messages has been sent yet.
            </Typography>
          )
        }
      />
      <View style={[styles.reactions, { backgroundColor: theme.color.backgroundLight }]}>
        {REACTIONS.map((emoji) => (
          <Pressable
            key={emoji}
            style={[styles.reactionBtn, { backgroundColor: theme.color.background }]}
            onPress={() => handleSendReaction(emoji)}
          >
            <Typography variant="body">{emoji}</Typography>
          </Pressable>
        ))}
      </View>
      <View style={[styles.inputRow, { backgroundColor: theme.color.background }]}>
        <TextInput
          style={[styles.input, { color: theme.color.white }]}
          placeholder="Send a message"
          placeholderTextColor={theme.color.gray02}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSendText}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendBtn, { backgroundColor: theme.color.primary }]}
          onPress={handleSendText}
        >
          <Typography variant="smallBody" weight="bold" color={theme.color.white}>
            Send
          </Typography>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: 200,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  participantAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  extraAvatar: {
    minWidth: 28,
    paddingHorizontal: 4,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexGrow: 1,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  messageBubble: {
    flex: 1,
  },
  reactions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  reactionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
