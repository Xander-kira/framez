import React, { useState } from 'react';
import { View, TextInput, Image, StyleSheet, Alert, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function Create() {
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Images AND videos
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
      videoMaxDuration: 30, // 30 seconds max
    });
    
    if (!res.canceled && res.assets?.length) {
      setImageUri(res.assets[0].uri);
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setAudioUri(result.assets[0].uri);
        setAudioName(result.assets[0].name);
      }
    } catch (error) {
      console.error('Error picking audio:', error);
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
    if (!content.trim() && !imageUri && !audioUri) {
      Alert.alert('Empty post', 'Write something or choose media.');
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

      let audio_url: string | null = null;
      if (audioUri) {
        audio_url = await uploadImage(audioUri, session.user.id); // Same upload function works for audio
      }

      console.log('Attempting to insert post with author_id:', session.user.id);
      
      const { data, error } = await supabase.from('posts').insert({
        author_id: session.user.id,
        content: content.trim() || null,
        image_url,
        audio_url,
      }).select();
      
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

      {audioUri && (
        <View style={styles.audioContainer}>
          <Text style={styles.audioText}>🎵 {audioName}</Text>
          <TouchableOpacity 
            style={styles.removeAudioButton}
            onPress={() => {
              setAudioUri(null);
              setAudioName(null);
            }}
          >
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.buttonsRow}>
        <TouchableOpacity 
          style={styles.pickButton}
          onPress={pickImage}
          disabled={loading}
        >
          <Text style={styles.pickButtonText}>
            {imageUri ? '📷 Change' : '📷 Photo/Video'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.pickButton}
          onPress={pickAudio}
          disabled={loading}
        >
          <Text style={styles.pickButtonText}>
            {audioUri ? '🎵 Change' : '🎵 Add Music'}
          </Text>
        </TouchableOpacity>
      </View>
      
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
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 16,
  },
  audioText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  removeAudioButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickButton: {
    flex: 1,
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
