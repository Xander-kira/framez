import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';

interface Post {
  id: string;
  image_url?: string;
  content?: string;
  created_at: string;
  reaction_counts?: Record<string, number>;
  user_reaction?: string | null;
}

export default function Feed() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !postsData) {
      console.error("Error fetching posts:", error);
      return;
    }

    // Fetch all reactions for these posts
    const postIds = postsData.map(p => p.id);
    const { data: reactions, error: reactionsError } = await supabase
      .from("post_reactions")
      .select("post_id, user_id, type")
      .in("post_id", postIds);

    if (reactionsError) {
      console.error("Error fetching reactions:", reactionsError);
    }

    // Process reactions for each post
    const postsWithReactions = postsData.map(post => {
      const postReactions = reactions?.filter(r => r.post_id === post.id) || [];
      
      // Count reactions by type
      const counts: Record<string, number> = {};
      for (const r of postReactions) {
        counts[r.type] = (counts[r.type] || 0) + 1;
      }

      // Find current user's reaction
      const userReaction = postReactions.find(r => r.user_id === session?.user?.id);

      return {
        ...post,
        reaction_counts: counts,
        user_reaction: userReaction?.type || null,
      };
    });

    setPosts(postsWithReactions);
  };

  const fetchAll = async () => {
    setLoading(true);
    await fetchPosts();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Posts */}
      <View style={styles.postsContainer}>
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to create a post!</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              {post.image_url && (
                <Image 
                  source={{ uri: post.image_url }} 
                  style={styles.postImage}
                />
              )}
              {post.content && (
                <View style={styles.postContent}>
                  <Text style={styles.postCaption}>{post.content}</Text>
                  <Text style={styles.postDate}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  postsContainer: {
    padding: 12,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#ddd',
  },
  postContent: {
    padding: 16,
  },
  postCaption: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});