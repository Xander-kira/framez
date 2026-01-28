import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { createStory } from '../../lib/social';

export default function CreateStory() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow images AND videos
      quality: 0.8,
      allowsEditing: true,
      aspect: [9, 16],
      videoMaxDuration: 15, // 15 seconds max for stories
    });

    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
      });

      if (!result.canceled && result.assets?.[0]) {
        setAudioUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Audio picker error:', error);
    }
  };

  const handlePost = async () => {
    if (!imageUri) {
      Alert.alert('No image', 'Please select an image first.');
      return;
    }

    try {
      setLoading(true);
      await createStory(imageUri, audioUri);
      Alert.alert('Success! 🎉', 'Your story has been posted!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Story upload error:', error);
      Alert.alert('Error', error.message || 'Failed to post story');
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
          <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
            <Text style={styles.changeButtonText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
          <Text style={styles.pickIcon}>📷</Text>
          <Text style={styles.pickButtonText}>Select Photo</Text>
        </TouchableOpacity>
      )}

      {imageUri && (
        <TouchableOpacity
          style={styles.audioButton}
          onPress={pickAudio}
        >
          <Text style={styles.audioButtonText}>
            {audioUri ? '✓ Audio Added' : '+ Add Audio (Optional)'}
          </Text>
        </TouchableOpacity>
      )}

      {imageUri && (
        <TouchableOpacity
          style={[styles.postButton, loading && styles.postButtonDisabled]}
          onPress={handlePost}
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
  audioButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  audioButtonText: {
    color: '#007AFF',
    fontSize: 16,
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
