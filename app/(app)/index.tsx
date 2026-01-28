import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, FlatList, RefreshControl, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { PostCard } from '../../components/PostCard';
import { StoryCircle } from '../../components/StoryCircle';
import { StoryViewer } from '../../components/StoryViewer';
import { useAuth } from '../../context/AuthProvider';
import { getStories } from '../../lib/social';

export default function Feed() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  const fetchFeed = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          audio_url,
          created_at,
          author_id,
          profiles:author_id (
            full_name,
            avatar_url
          ),
          post_reactions(type, user_id),
          post_comments(id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(
        (data || []).map((post) => ({
          ...post,
          post_comments: Array.isArray(post.post_comments) ? post.post_comments : [],
          post_reactions: Array.isArray(post.post_reactions) ? post.post_reactions : [],
        }))
      );

      // Fetch stories
      const storiesData = await getStories();
      setStories(storiesData);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    // Real-time subscription for new posts
    const channel = supabase
      .channel('posts-feed')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts' 
      }, (payload) => {
        setPosts((prev) => [payload.new as any, ...prev]);
      })
      .subscribe();
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, []);

  // Refresh feed when screen is focused (e.g., after returning from comments)
  useFocusEffect(
    React.useCallback(() => {
      fetchFeed();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Framez",
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/notifications" as any)}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.container}>
        <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.storiesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesScroll}
            >
              {/* Current user's story */}
              <StoryCircle
                userName="Your Story"
                userImage={session?.user?.user_metadata?.avatar_url}
                isCurrentUser
                onPress={() => router.push('/create-story' as any)}
              />

              {/* Other users' stories */}
              {stories.map((storyGroup: any, index: number) => (
                <StoryCircle
                  key={storyGroup.user_id}
                  userName={storyGroup.full_name}
                  userImage={storyGroup.avatar_url}
                  thumbnailUrl={storyGroup.stories[0]?.image_url}
                  hasViewed={false}
                  onPress={() => {
                    setViewerStartIndex(index);
                    setViewerVisible(true);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            id={item.id}
            authorName={item.profiles?.full_name || 'Unknown User'}
            authorAvatar={item.profiles?.avatar_url}
            timestamp={item.created_at}
            content={item.content}
            imageUrl={item.image_url}
            audioUrl={item.audio_url}
            currentUserId={session?.user?.id}
            reactions={item.post_reactions || []}
            commentsCount={(item.post_comments || []).length}
            onCommentPress={() => router.push(`/comments/${item.id}` as any)}
          />
        )}
      />

      {/* Story Viewer Modal */}
      <StoryViewer
        visible={viewerVisible}
        storyGroups={stories}
        initialGroupIndex={viewerStartIndex}
        onClose={() => setViewerVisible(false)}
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  storiesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  storiesScroll: {
    paddingHorizontal: 12,
  },
  centerContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: { 
    fontSize: 16, 
    color: '#666' 
  },
  emptyContainer: { 
    padding: 40, 
    alignItems: 'center' 
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333',
    marginBottom: 8
  },
  emptySubtext: { 
    fontSize: 14, 
    color: '#999' 
  },
});