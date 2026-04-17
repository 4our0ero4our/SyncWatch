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

function formatMessageTime(createdAt?: string): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

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
  const [showReactions, setShowReactions] = useState(false);

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
      setShowReactions(false);
    } catch (e) {
      console.error("[RoomChat] send reaction error", e);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const displayName = item.displayName ?? item.userId.slice(0, 12) + (item.userId.length > 12 ? "…" : "");
    const avatarSource = getAvatarSource(item.avatar);
    const msgTime = formatMessageTime(item.createdAt);
    return (
      <View style={styles.messageRow}>
        <Image source={avatarSource} style={styles.messageAvatar} />
        <View style={styles.messageBubble}>
          <View style={styles.messageMetaRow}>
            <Typography variant="smallBody" weight="medium">
              {displayName}
            </Typography>
            {!!msgTime && (
              <Typography variant="caption" weight="regular" color={theme.color.textMuted}>
                {msgTime}
              </Typography>
            )}
          </View>
          {item.type === "text" ? (
            <Typography variant="smallBody" weight="regular" style={styles.messageText}>
              {item.content}
            </Typography>
          ) : (
            <Typography variant="smallBody" weight="medium" style={styles.messageText}>
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
      <View style={[styles.inputRow, { backgroundColor: theme.color.background }]}>
        {showReactions && (
          <View style={styles.reactionPicker}>
            {REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.reactionOption}
                onPress={() => handleSendReaction(emoji)}
              >
                <Typography variant="body">{emoji}</Typography>
              </Pressable>
            ))}
          </View>
        )}
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
          style={styles.iconBtn}
          onPress={() => setShowReactions((prev) => !prev)}
        >
          <Typography variant="body" color="#9CA3AF">☺</Typography>
        </Pressable>
        <Pressable
          style={[styles.sendBtn, { backgroundColor: "#2A2D36" }]}
          onPress={handleSendText}
        >
          <Typography variant="smallBody" weight="bold" color={theme.color.white}>
            ➤
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
  messageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  messageText: {
    marginTop: 2,
  },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    position: "relative",
  },
  reactionPicker: {
    position: "absolute",
    bottom: 52,
    right: 54,
    flexDirection: "row",
    backgroundColor: "#111216",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  reactionOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    fontSize: 14,
    backgroundColor: "#15171E",
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
