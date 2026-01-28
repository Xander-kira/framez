import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabase';
import { getSavedPosts, getUserPosts } from '../../lib/social';
import { PostCard } from '../../components/PostCard';

type Tab = 'posts' | 'saved';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    // Fetch session directly instead of relying on context
    supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user?.id;
      console.log('Profile - Got user ID:', id);
      setUserId(id || null);
      if (id) {
        loadProfile(id);
        loadPosts(id);
      } else {
        setLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userId) {
      loadPosts(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('id', uid)
        .single();

      if (error) throw error;
      setProfile(data || { id: uid, full_name: 'User', avatar_url: null, bio: null });
    } catch (error) {
      console.error('Load profile error:', error);
      // Set default profile if fetch fails
      setProfile({ id: uid, full_name: 'User', avatar_url: null, bio: null });
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (uid: string) => {
    setPostsLoading(true);
    try {
      const data = activeTab === 'posts' 
        ? await getUserPosts(uid)
        : await getSavedPosts();
      
      setPosts(data);
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(userId!), loadPosts(userId!)]);
    setRefreshing(false);
  };

  const handleChangeAvatar = async () => {
    if (!userId) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    setUploadingAvatar(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${ext}`;

      let fileData: any;
      
      if (Platform.OS === 'web') {
        // Web: use blob and arrayBuffer
        const response = await fetch(uri);
        const blob = await response.blob();
        fileData = await blob.arrayBuffer();
      } else {
        // React Native: Read file as base64 and convert
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Use FileReader to convert blob to arrayBuffer for React Native
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(blob);
        });
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileData, {
          contentType: `image/${ext}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrl = data.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Refresh profile
      await loadProfile(userId);
      Alert.alert('Success', 'Profile photo updated!');
    } catch (error: any) {
      console.error('Avatar update error:', error);
      Alert.alert('Error', error.message || 'Failed to update photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error: any) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Text>Not logged in</Text>
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
          <View style={styles.header}>
            <TouchableOpacity onPress={handleChangeAvatar} disabled={uploadingAvatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={48} color="#999" />
                </View>
              )}
              {uploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <View style={styles.avatarEditIcon}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.name}>{profile?.full_name || 'User'}</Text>

            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>{activeTab === 'posts' ? 'Posts' : 'Saved'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/edit-profile' as any)}
            >
              <Ionicons name="create-outline" size={18} color="#007AFF" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                onPress={() => setActiveTab('posts')}
              >
                <Ionicons
                  name="grid"
                  size={24}
                  color={activeTab === 'posts' ? '#007AFF' : '#999'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
                onPress={() => setActiveTab('saved')}
              >
                <Ionicons
                  name="bookmark"
                  size={24}
                  color={activeTab === 'saved' ? '#007AFF' : '#999'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            id={item.id}
            authorName={item.profiles?.full_name || profile?.full_name || 'User'}
            authorAvatar={item.profiles?.avatar_url || profile?.avatar_url}
            timestamp={item.created_at}
            content={item.content}
            imageUrl={item.image_url}
            audioUrl={item.audio_url}
            currentUserId={userId}
            reactions={item.post_reactions || []}
            commentsCount={item.post_comments?.length || 0}
            onCommentPress={() => router.push(`/comments/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Ionicons
                name={activeTab === 'posts' ? 'images-outline' : 'bookmark-outline'}
                size={48}
                color="#ccc"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'posts' ? 'No posts yet' : 'No saved posts'}
              </Text>
            </View>
          )
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
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#007AFF',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 16,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  tabs: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#8E8E93',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
