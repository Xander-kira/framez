import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { addComment } from "../../lib/social";
import PostComments from "../(app)/PostComments";

const QUICK_EMOJIS = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🙌'];

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  console.log("COMMENTS SCREEN postId:", postId);
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);

  async function handleAddComment() {
    if (!postId) return;

    const content = text.trim();
    if (!content) return;

    setText("");

    try {
      await addComment(postId, content);
    } catch (error: any) {
      console.log("ADD COMMENT ERROR:", error.message);
    }
  }

  if (!postId || typeof postId !== "string") {
    return <Text>Invalid post ID.</Text>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, padding: 16 }}>
        <PostComments postId={postId} />
      </View>
      <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: "#eee" }}>
        {showEmojis && (
          <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 8, paddingHorizontal: 4 }}>
            {QUICK_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => setText(text + emoji)}
                style={{ padding: 4 }}
              >
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <View style={{ flexDirection: "row", gap: 10, alignItems: 'center' }}>
          <Pressable
            onPress={() => setShowEmojis(!showEmojis)}
            style={{ padding: 8 }}
          >
            <Ionicons name="happy-outline" size={24} color="#666" />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a comment…"
            multiline
            maxLength={500}
            style={{
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "#f2f2f2",
              color: "#111",
              maxHeight: 100,
            }}
          />
          <Pressable
            onPress={handleAddComment}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: text.trim() ? "#007AFF" : "#ccc",
            }}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}