import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, getUserPosts, getFollowStatus, followUser, unfollowUser } from '../../../lib/social';
import { PostCard } from '../../../components/PostCard';
import { useAuth } from '../../../context/AuthProvider';

type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
};

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);
    // eslint-disable-next-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileData, postsData, followStatus] = await Promise.all([
        getUserProfile(userId),
        getUserPosts(userId),
        !isOwnProfile ? getFollowStatus(userId) : Promise.resolve({ isFollowing: false }),
      ]);

      setProfile(profileData);
      setPosts(postsData);
      setIsFollowing(followStatus.isFollowing);
    } catch (error) {
      console.error('Load profile error:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
      }
    } catch (error: any) {
      console.error('Follow error:', error);
      Alert.alert('Error', error.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={48} color="#999" />
              </View>
            )}

            <Text style={styles.name}>{profile.full_name}</Text>

            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
            </View>

            {!isOwnProfile && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                  followLoading && styles.followButtonDisabled,
                ]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator color={isFollowing ? '#007AFF' : '#fff'} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.postsTitle}>Posts</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            id={item.id}
            authorName={item.profiles?.full_name || 'Unknown'}
            authorAvatar={item.profiles?.avatar_url}
            content={item.content}
            imageUrl={item.image_url}
            audioUrl={item.audio_url}
            timestamp={item.created_at}
            reactions={item.post_reactions || []}
            commentsCount={item.post_comments?.length || 0}
            currentUserId={session?.user?.id}
            onCommentPress={() => router.push(`/comments/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarPlaceholder: {
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  bio: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#007AFF',
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});
