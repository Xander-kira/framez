// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, Image, Platform } from 'react-native';
// import * as FileSystem from 'expo-file-system';
// import * as LegacyFileSystem from 'expo-file-system/legacy';
// // Import File class from expo-file-system
// import { File } from 'expo-file-system';
// import { Buffer } from 'buffer';
// import * as ImagePicker from 'expo-image-picker';
// import { supabase } from '../../lib/supabase';
// import { useAuth } from '../../context/AuthProvider';
// import { PostCard } from '../../components/PostCard';

// export default function Profile() {
//   const { session, signOut } = useAuth();
//   const [profile, setProfile] = useState<any>(null);
//   const [avatarUploading, setAvatarUploading] = useState(false);
//   const [posts, setPosts] = useState<any[]>([]);
//   const [refreshing, setRefreshing] = useState(false);

//   // Handler to delete a post
//   const handleDeletePost = (postId: string) => {
//     (async () => {
//       const { error } = await supabase.from('posts').delete().eq('id', postId);
//       if (error) {
//         Alert.alert('Delete failed', error.message);
//       } else {
//         setPosts((prev) => prev.filter((p) => p.id !== postId));
//         Alert.alert('Post deleted');
//       }
//     })();
//   };

//   // Avatar picker and upload
//   const pickAvatar = async () => {
//     if (!session?.user?.id) {
//       Alert.alert('Error', 'You must be logged in to change your profile picture.');
//       return;
//     }
//       const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert('Permission required', 'Please allow access to your media library.');
//         return;
//       }
//     try {
//      const result = await ImagePicker.launchImageLibraryAsync({
//   mediaTypes: ImagePicker.MediaTypeOptions.Images,
//   allowsEditing: true,
//   aspect: [1, 1],
//   quality: 0.7,
// });
//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         setAvatarUploading(true);
//         const asset = result.assets[0];
//         const uri = asset.uri;
//         // Check file size (max 5MB)
//         if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
//           setAvatarUploading(false);
//           Alert.alert('Image too large', 'Please select an image smaller than 5MB.');
//           return;
//         }
//         let fileData;
//         let contentType = 'image/jpeg';
//         let ext = uri.split('.').pop();
//         let uploadResult;
//         try {
//           if (Platform.OS === 'web') {
//             // Web: use fetch and blob
//             const response = await fetch(uri);
//             fileData = await response.blob();
//             contentType = fileData.type || 'image/jpeg';
//             uploadResult = await supabase.storage.from('avatars').upload(`${session.user.id}.${ext}`, fileData, {
//               upsert: true,
//               contentType,
//             });
//           } else {
//             // Mobile: use legacy API for base64
//             fileData = await LegacyFileSystem.readAsStringAsync(uri, { encoding: 'base64' });
//             uploadResult = await supabase.storage.from('avatars').upload(`${session.user.id}.${ext}`, Buffer.from(fileData, 'base64'), {
//               upsert: true,
//               contentType,
//             });
//           }
//         } catch (err: any) {
//           setAvatarUploading(false);
//           Alert.alert('Upload failed', err.message || 'Upload timed out. Please try again.');
//           console.log('Avatar upload error:', err);
//           return;
//         }
//         setAvatarUploading(false);
//         if (uploadResult && uploadResult.error) {
//           Alert.alert('Avatar upload failed', uploadResult.error.message);
//           console.log('Supabase upload error:', uploadResult.error);
//           return;
//         }
//         // Get public URL
//         const { data } = supabase.storage.from('avatars').getPublicUrl(`${session.user.id}.${ext}`);
//         const avatarUrl = data?.publicUrl || null;
//         await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', session.user.id);
//         setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
//       }
//     } catch (e: any) {
//       setAvatarUploading(false);
//       Alert.alert('Error', e.message || 'Failed to pick or upload image.');
//     }
//   };

//   // Fetch profile
//   const fetchProfile = async () => {
//     const userId = session?.user?.id;
//     if (!userId) return;
//     const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
//     setProfile(prof);
//   };

//   // Fetch posts for the user
//   const fetchPosts = async () => {
//   const userId = session?.user?.id;
//   if (!userId) return;
//   const { data: postsData } = await supabase.from('posts').select('*').eq('author_id', userId).order('created_at', { ascending: false });
//   setPosts(postsData || []);
//   };

//   const fetchAll = async () => {
//     await fetchProfile();
//     await fetchPosts();
//   };

//   useEffect(() => {
//     fetchAll();
//   }, [session]);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchAll();
//     setRefreshing(false);
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <View style={styles.avatarContainer}>
//           <TouchableOpacity onPress={pickAvatar} disabled={avatarUploading}>
//             {profile?.avatar_url ? (
//               <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
//             ) : (
//               <View style={styles.avatar}>
//                 <Text style={styles.avatarText}>
//                   {profile?.first_name?.[0] || profile?.username?.[0] || 'U'}
//                 </Text>
//               </View>
//             )}
//           </TouchableOpacity>
//           {avatarUploading && (
//             <Text style={styles.avatarUploading}>Uploading...</Text>
//           )}
//         </View>
//         <Text style={styles.name}>{profile?.first_name || profile?.username || 'User'}</Text>
//         <Text style={styles.email}>{profile?.email || session?.user?.email || ''}</Text>
//         <View style={styles.statsContainer}>
//           <View style={styles.stat}>
//             <Text style={styles.statNumber}>{posts.length}</Text>
//             <Text style={styles.statLabel}>Posts</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>
//       <Text style={styles.myPostsTitle}>My Posts</Text>
//       <FlatList
//         data={posts}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <PostCard
//             postId={item.id}
//             authorId={item.author_id}
//             authorName={item.author_name || profile?.first_name || profile?.username || 'Unknown'}
//             createdAt={item.created_at}
//             content={item.content}
//             imageUrl={item.image_url}
//             currentUserId={session?.user?.id}
//             onDelete={handleDeletePost}
//           />
//         )}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyText}>No posts yet</Text>
//             <Text style={styles.emptySubtext}>Create your first post!</Text>
//           </View>
//         }
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   header: {
//     backgroundColor: '#fff',
//     paddingVertical: 24,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//     alignItems: 'center',
//   },
//   avatarContainer: {
//     marginBottom: 16,
//   },
//   avatarImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     marginBottom: 8,
//   },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#007AFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 8,
//   },
//   avatarUploading: {
//     color: '#007AFF',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   avatarText: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   name: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 4,
//   },
//   email: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 20,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     marginBottom: 20,
//   },
//   stat: {
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   statNumber: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 4,
//   },
//   logoutButton: {
//     backgroundColor: '#FF3B30',
//     paddingVertical: 12,
//     paddingHorizontal: 32,
//     borderRadius: 8,
//     marginBottom: 20,
//   },
//   logoutText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   myPostsTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     alignSelf: 'flex-start',
//     marginTop: 16,
//     marginBottom: 12,
//     paddingHorizontal: 16,
//   },
//   emptyContainer: {
//     padding: 40,
//     alignItems: 'center',
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#999',
//   },
// });



import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { PostCard } from '../../components/PostCard';

type Post = {
  id: string;
  author_id: string;
  created_at: string;
  content?: string | null;
  image_url?: string | null;
  author_name?: string | null;
};

export default function Profile() {
  const { session, signOut } = useAuth();
  const userId = session?.user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ---- Delete Post ----
  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      Alert.alert('Delete failed', error.message);
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
      Alert.alert('Post deleted');
    }
  };

  // ---- Avatar Picker & Upload (robust) ----
  const pickAvatar = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to change your profile picture.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your media library.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      setAvatarUploading(true);
      const asset = result.assets[0];

      // Some pickers provide fileSize; if present, enforce 5MB cap
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Image too large', 'Please select an image smaller than 5MB.');
        return;
      }

      // Android URIs often have no extension—derive from mime or default to jpg
      const mime = (asset.mimeType as string) || 'image/jpeg';
      const ext = mime.includes('png') ? 'png' : 'jpg';

      // Unique path prevents cache issues and ensures new file each upload
      const filePath = `${userId}/${Date.now()}.${ext}`;

      // Upload
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const { error } = await supabase.storage.from('avatars').upload(filePath, blob, {
          upsert: true,
          contentType: mime,
        });
        if (error) throw error;
      } else {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: "base64",
        });
        const { error } = await supabase.storage
          .from('avatars')
          .upload(filePath, Buffer.from(base64, 'base64'), {
            upsert: true,
            contentType: mime,
          });
        if (error) throw error;
      }

      // Get public URL + cache-buster
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data?.publicUrl ? `${data.publicUrl}?v=${Date.now()}` : null;

      // Save to profile
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);

      // Local state update
      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    } catch (e: any) {
      console.log('Avatar upload error:', e);
      Alert.alert('Upload failed', e.message || 'Could not upload image.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // ---- Data fetching ----
  const fetchProfile = async () => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data);
  };

  const fetchPosts = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });
    setPosts(data || []);
  };

  const fetchAll = async () => {
    await fetchProfile();
    await fetchPosts();
  };

  useEffect(() => {
    fetchAll();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  // ---- UI ----
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickAvatar} disabled={avatarUploading}>
            {profile?.avatar_url ? (
              <Image
                key={profile.avatar_url}             // forces re-render on URL change
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.first_name?.[0] || profile?.username?.[0] || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {avatarUploading && <Text style={styles.avatarUploading}>Uploading...</Text>}
        </View>

        <Text style={styles.name}>{profile?.first_name || profile?.username || 'User'}</Text>
        <Text style={styles.email}>{profile?.email || session?.user?.email || ''}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.myPostsTitle}>My Posts</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <PostCard
            postId={item.id}
            authorId={item.author_id}
            authorName={item.author_name || profile?.first_name || profile?.username || 'Unknown'}
            createdAt={item.created_at}
            content={item.content}
            imageUrl={item.image_url}
            currentUserId={userId}
            onDelete={handleDeletePost}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Create your first post!</Text>
          </View>
        }
      />
    </View>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  avatarContainer: { marginBottom: 16 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarUploading: { color: '#007AFF', fontSize: 12, marginTop: 4 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', marginBottom: 20 },
  stat: { alignItems: 'center', paddingHorizontal: 20 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 20,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  myPostsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999' },
});
