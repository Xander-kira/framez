import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function CreateStory() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [9, 16], // Story aspect ratio
    });
    
    if (!res.canceled && res.assets?.length) {
      setImageUri(res.assets[0].uri);
    }
  };

  const uploadStory = async () => {
    if (!imageUri) {
      Alert.alert('No image', 'Please select an image first.');
      return;
    }

    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      // Upload image to storage
      const ext = imageUri.split('.').pop() || 'jpg';
      const path = `stories/${session.user.id}/${Date.now()}.${ext}`;
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, arrayBuffer, { 
          contentType: `image/${ext}`,
          upsert: false 
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(uploadData.path);

      // Insert story record
      const { error: insertError } = await supabase.from('stories').insert({
        user_id: session.user.id,
        image_url: publicUrl,
      });
      
      if (insertError) throw insertError;

      Alert.alert('Success! 🎉', 'Your story has been posted!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
    } catch (e: any) {
      console.error('Story upload error:', e);
      Alert.alert('Error', e.message || 'Failed to post story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Story</Text>
      <Text style={styles.subtitle}>Share a moment that disappears in 24 hours</Text>
      
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <TouchableOpacity 
            style={styles.changeButton}
            onPress={pickImage}
          >
            <Text style={styles.changeButtonText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.pickButton}
          onPress={pickImage}
        >
          <Text style={styles.pickIcon}>📷</Text>
          <Text style={styles.pickButtonText}>Select Photo</Text>
        </TouchableOpacity>
      )}
      
      {imageUri && (
        <TouchableOpacity 
          style={[styles.postButton, loading && styles.postButtonDisabled]}
          onPress={uploadStory}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post Story</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  previewContainer: {
    flex: 1,
    marginBottom: 20,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#000',
  },
  changeButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  pickIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  pickButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  postButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
