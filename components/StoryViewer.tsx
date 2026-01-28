import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
  StatusBar,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

type Story = {
  id: string;
  image_url: string;
  audio_url?: string;
  created_at: string;
};

type StoryGroup = {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  stories: Story[];
};

type Props = {
  visible: boolean;
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
};

export function StoryViewer({ visible, storyGroups, initialGroupIndex, onClose }: Props) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused] = useState(false);
  const audioRef = useRef<Audio.Sound | null>(null);
  
  const progress = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef<Animated.CompositeAnimation | null>(null);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  // Pan responder for swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        }
      },
    })
  ).current;

  // Story progress animation
  useEffect(() => {
    if (!visible || !currentStory || isPaused) return;

    progress.setValue(0);
    progressAnim.current = Animated.timing(progress, {
      toValue: 1,
      duration: 5000, // 5 seconds per story
      useNativeDriver: false,
    });

    progressAnim.current.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => {
      progressAnim.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoryIndex, currentGroupIndex, visible, isPaused]);

  // Play audio when story changes
  useEffect(() => {
    if (!visible || !currentStory?.audio_url) return;

    let isMounted = true;

    async function playAudio() {
      try {
        // Unload previous audio
        if (audioRef.current) {
          await audioRef.current.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: currentStory.audio_url! },
          { shouldPlay: true, isLooping: true }
        );
        
        if (isMounted) {
          audioRef.current = sound;
        }
      } catch (error) {
        console.error('Audio playback error:', error);
      }
    }

    playAudio();

    return () => {
      isMounted = false;
      audioRef.current?.unloadAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?.id, visible]);

  const handleNext = () => {
    const nextStoryIndex = currentStoryIndex + 1;
    
    if (nextStoryIndex < currentGroup.stories.length) {
      setCurrentStoryIndex(nextStoryIndex);
    } else {
      // Move to next user's stories
      const nextGroupIndex = currentGroupIndex + 1;
      if (nextGroupIndex < storyGroups.length) {
        setCurrentGroupIndex(nextGroupIndex);
        setCurrentStoryIndex(0);
      } else {
        onClose();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentGroupIndex > 0) {
      const prevGroupIndex = currentGroupIndex - 1;
      setCurrentGroupIndex(prevGroupIndex);
      setCurrentStoryIndex(storyGroups[prevGroupIndex].stories.length - 1);
    }
  };

  const handleTap = (x: number) => {
    const tapRegion = width / 3;
    if (x < tapRegion) {
      handlePrevious();
    } else if (x > tapRegion * 2) {
      handleNext();
    }
  };

  if (!visible || !currentGroup || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Story Image or Video */}
        {currentStory.image_url.includes('.mp4') || currentStory.image_url.includes('.mov') ? (
          <Video
            source={{ uri: currentStory.image_url }}
            style={styles.storyImage}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={!isPaused}
            isLooping={false}
            isMuted={false}
          />
        ) : (
          <Image
            source={{ uri: currentStory.image_url }}
            style={styles.storyImage}
            resizeMode="contain"
          />
        )}

        {/* Gradient overlay at top */}
        <View style={styles.topGradient} />

        {/* Progress bars */}
        <View style={styles.progressContainer}>
          {currentGroup.stories.map((_, index) => (
            <View key={index} style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width:
                      index < currentStoryIndex
                        ? '100%'
                        : index === currentStoryIndex
                        ? progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {currentGroup.avatar_url ? (
              <Image source={{ uri: currentGroup.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {currentGroup.full_name[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>{currentGroup.full_name}</Text>
            <Text style={styles.timeAgo}>
              {getTimeAgo(currentStory.created_at)}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tap zones for navigation */}
        <View style={styles.tapZones}>
          <TouchableOpacity
            style={styles.tapLeft}
            activeOpacity={1}
            onPress={() => handleTap(width * 0.2)}
          />
          <TouchableOpacity
            style={styles.tapRight}
            activeOpacity={1}
            onPress={() => handleTap(width * 0.8)}
          />
        </View>
      </View>
    </Modal>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyImage: {
    width: width,
    height: height,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  timeAgo: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  closeButton: {
    padding: 4,
  },
  tapZones: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 2,
  },
});
