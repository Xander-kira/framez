import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  uri: string;
  style?: any;
  resizeMode?: ResizeMode;
  shouldPlay?: boolean;
  isLooping?: boolean;
  isMuted?: boolean;
};

export function VideoPlayer({ 
  uri, 
  style, 
  resizeMode = ResizeMode.CONTAIN, 
  shouldPlay = false,
  isLooping = false,
  isMuted = true 
}: Props) {
  const [isPlaying, setIsPlaying] = useState(shouldPlay);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<Video>(null);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={resizeMode}
        shouldPlay={shouldPlay}
        isLooping={isLooping}
        isMuted={isMuted}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <TouchableOpacity
        style={styles.playPauseButton}
        onPress={handlePlayPause}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={40}
          color="rgba(255,255,255,0.9)"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
