import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from "react-native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ReactionBar from "./ReactionBar";
import { VideoPlayer } from "./VideoPlayer";
import { AudioPlayer } from "./AudioPlayer";
import { toggleReaction, ReactionType, savePost, unsavePost, isSaved } from "../lib/social";

dayjs.extend(relativeTime);

type Props = {
  id: string;
  authorName: string;
  authorAvatar?: string | null;
  timestamp: string;
  content?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  currentUserId?: string;
  reactions?: { type: string; user_id: string }[];
  commentsCount?: number;
  onCommentPress?: () => void;
};

export function PostCard({
  id,
  authorName,
  authorAvatar,
  timestamp,
  content,
  imageUrl,
  audioUrl,
  currentUserId,
  reactions = [],
  commentsCount = 0,
  onCommentPress,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    checkSavedStatus();
  }, [id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps

  const checkSavedStatus = async () => {
    try {
      const result = await isSaved(id);
      setSaved(result.saved);
    } catch (error) {
      console.error('Check saved error:', error);
    }
  };

  const handleSaveToggle = async () => {
    setSaveLoading(true);
    try {
      if (saved) {
        await unsavePost(id);
        setSaved(false);
      } else {
        await savePost(id);
        setSaved(true);
      }
    } catch (error: any) {
      console.error('Save toggle error:', error);
      Alert.alert('Error', error.message || 'Failed to save post');
    } finally {
      setSaveLoading(false);
    }
  };

  async function handleReaction(type: ReactionType) {
    try {
      await toggleReaction(id, type);
    } catch (error: any) {
      console.log("REACTION ERROR:", error.message);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {authorAvatar ? (
          <Image source={{ uri: authorAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {(authorName || "U")[0].toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{authorName || "Unknown"}</Text>
          <Text style={styles.time}>{dayjs(timestamp).fromNow()}</Text>
        </View>

        <TouchableOpacity
          onPress={handleSaveToggle}
          disabled={saveLoading}
          style={styles.saveButton}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={saved ? "#007AFF" : "#666"}
          />
        </TouchableOpacity>
      </View>

      {!!content && <Text style={styles.content}>{content}</Text>}
      
      {!!imageUrl && (
        imageUrl.includes('.mp4') || imageUrl.includes('.mov') ? (
          <VideoPlayer uri={imageUrl} style={styles.video} />
        ) : (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        )
      )}

      {!!audioUrl && <AudioPlayer uri={audioUrl} title="🎵 Audio" />}

      <ReactionBar
        reactions={reactions}
        commentsCount={commentsCount}
        currentUserId={currentUserId || ""}
        onPickReaction={handleReaction}
        onOpenComments={onCommentPress || (() => router.push(`/comments/${id}` as any))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#888",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarPlaceholder: {
    backgroundColor: "#e0e0e0",
  },
  name: { fontWeight: "700", fontSize: 15, color: "#1a1a1a" },
  time: { color: "#666", fontSize: 12, fontWeight: "500" },
  content: { marginTop: 4, marginBottom: 8, fontSize: 16, color: "#2c2c2c", lineHeight: 22 },
  image: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    height: 220,
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: "#eee",
  },
  video: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    height: 220,
    borderRadius: 8,
    marginTop: 6,
  },
  saveButton: {
    padding: 8,
  },
});
