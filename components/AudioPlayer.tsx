import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  uri: string;
  title?: string;
};

export function AudioPlayer({ uri, title }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadAndPlaySound = async () => {
    try {
      setIsLoading(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error loading sound:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setPosition(0);
        setIsPlaying(false);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) {
      await loadAndPlaySound();
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={handlePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color="#007AFF"
          />
        )}
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title || '🎵 Audio'}
        </Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.timeText}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  timeText: {
    fontSize: 11,
    color: '#666',
    minWidth: 70,
  },
});
