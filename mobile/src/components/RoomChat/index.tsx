import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useUnistyles } from "react-native-unistyles";
import Typography from "@/src/components/common/Typography";
import { getMessages, sendMessage, type ChatMessage } from "@/src/services/chat";

const REACTIONS = ["👍", "😂", "❤️", "😮", "😢", "🔥"];

type RoomChatProps = {
  roomId: string;
  token: string;
};

export default function RoomChat({ roomId, token }: RoomChatProps) {
  const { theme } = useUnistyles();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

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

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageRow}>
      {item.type === "text" ? (
        <Typography variant="smallBody" weight="regular">
          <Typography variant="caption" weight="medium" color={theme.color.textMuted}>
            {item.userId.slice(0, 8)}…
          </Typography>{" "}
          {item.content}
        </Typography>
      ) : (
        <Typography variant="smallBody" weight="medium">
          <Typography variant="caption" weight="medium" color={theme.color.textMuted}>
            {item.userId.slice(0, 8)}…
          </Typography>{" "}
          reacted {item.content}
        </Typography>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.color.backgroundLight }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <Typography variant="body" weight="bold">
          Chat
        </Typography>
      </View>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? null : (
            <Typography variant="smallBody" color={theme.color.textMuted}>
              No messages yet. Say hi!
            </Typography>
          )
        }
      />
      <View style={styles.reactions}>
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
          placeholder="Type a message..."
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
    maxHeight: 320,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  list: {
    padding: 12,
    flexGrow: 1,
    minHeight: 120,
  },
  messageRow: {
    marginBottom: 8,
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
