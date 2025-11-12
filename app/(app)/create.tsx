import React, { useState } from 'react';
import { View, TextInput, Image, StyleSheet, Alert, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function Create() {
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    
    if (!res.canceled && res.assets?.length) {
      setImageUri(res.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, userId: string) => {
    try {
      const ext = uri.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      
      // For React Native, we need to use FormData or read as base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert blob to ArrayBuffer for Supabase
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(path, arrayBuffer, { 
          contentType: `image/${ext}`,
          upsert: false 
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const onPost = async () => {
    if (!content.trim() && !imageUri) {
      Alert.alert('Empty post', 'Write something or choose an image.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', !!session, session?.user?.id);
      
      if (!session?.user) {
        throw new Error('Not authenticated. Please log in again.');
      }

      let image_url: string | null = null;
      if (imageUri) {
        image_url = await uploadImage(imageUri, session.user.id);
      }

      console.log('Attempting to insert post with author_id:', session.user.id);
      
      const { data, error } = await supabase.from('posts').insert({
  author_id: session.user.id,
  content: content.trim() || null,
  image_url,
      });
      
      console.log('Insert result:', { data, error });
      
      if (error) throw error;

      // Clear form
      setContent('');
      setImageUri(null);
      
      Alert.alert('Success! 🎉', 'Your post has been created.', [
        { text: 'OK', onPress: () => router.push('/(app)') }
      ]);
    } catch (e: any) {
      console.error('Post error:', e);
      Alert.alert('Error', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Post</Text>
      
      <TextInput
        placeholder="What's on your mind?"
        placeholderTextColor="#999"
        multiline
        value={content}
        onChangeText={setContent}
        style={styles.input}
        maxLength={500}
      />
      
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => setImageUri(null)}
          >
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.pickButton}
        onPress={pickImage}
        disabled={loading}
      >
        <Text style={styles.pickButtonText}>
          {imageUri ? '📷 Change Photo' : '📷 Add Photo'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.postButton, loading && styles.postButtonDisabled]}
        onPress={onPost}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.postButtonText}>Post</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20,
    backgroundColor: '#fff',
    minHeight: '100%'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  },
  input: { 
    minHeight: 120,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
    marginBottom: 16
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16
  },
  preview: { 
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#f0f0f0'
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  pickButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  pickButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600'
  },
  postButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  postButtonDisabled: {
    backgroundColor: '#ccc'
  },
  postButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
