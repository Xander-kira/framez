import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getComments } from "../../lib/social";

dayjs.extend(relativeTime);

interface Profile {
  full_name: string;
  avatar_url?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: Profile;
}

interface PostCommentsProps {
  postId: string;
}

const PostComments: React.FC<PostCommentsProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!postId) return;
    
    setLoading(true);
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch (error: any) {
      console.log("Load comments error:", error.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const renderItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <Text style={{ fontWeight: "700" }}>
        {item.profiles?.full_name ?? "Unknown"}
      </Text>
      <Text style={{ opacity: 0.6, fontSize: 12 }}>
        {dayjs(item.created_at).fromNow()}
      </Text>
      <Text style={{ marginTop: 4 }}>{item.content}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 20 }} />;
  }

  return (
    <FlatList
      data={comments}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={<Text>No comments yet.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  commentContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});

export default PostComments;
