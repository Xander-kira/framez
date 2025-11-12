import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { PostCard } from '../../components/PostCard';
import { StoryCircle } from '../../components/StoryCircle';
import { useAuth } from '../../context/AuthProvider';
import { router } from 'expo-router';

export default function Feed() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          author_id,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setPosts(data || []);
      
      // Fetch active stories (not expired)
      const { data: storiesData } = await supabase
        .from('stories')
        .select(`
          id,
          image_url,
          created_at,
          user_id,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      // Group stories by user
      const userStories = storiesData?.reduce((acc: any, story: any) => {
        if (!acc[story.user_id]) {
          acc[story.user_id] = {
            user_id: story.user_id,
            full_name: story.profiles?.full_name,
            avatar_url: story.profiles?.avatar_url,
            stories: []
          };
        }
        acc[story.user_id].stories.push(story);
        return acc;
      }, {});
      
      setStories(Object.values(userStories || {}));
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      
      // Remove from local state
      setPosts(prev => prev.filter(p => p.id !== postId));
      Alert.alert('Success', 'Post deleted');
    } catch (e: any) {
      console.error('Delete error:', e);
      Alert.alert('Error', 'Failed to delete post');
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
              {/* Current user's story (with + button) */}
              <StoryCircle
                userName="You"
                isCurrentUser
                onPress={() => router.push('/(app)/create-story')}
              />
              
              {/* Other users' stories */}
              {stories.slice(0, 8).map((story: any) => (
                <StoryCircle
                  key={story.user_id}
                  userName={story.full_name || 'User'}
                  userImage={story.avatar_url}
                  hasNewStory={true}
                  onPress={() => Alert.alert('Story', `${story.full_name} has ${story.stories.length} story/stories`)}
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
            postId={item.id}
            authorId={item.author_id}
            authorName={item.profiles?.full_name || 'Unknown User'}
            createdAt={item.created_at}
            content={item.content}
            imageUrl={item.image_url}
            currentUserId={session?.user?.id}
            onDelete={handleDelete}
          />
        )}
      />
    </View>
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