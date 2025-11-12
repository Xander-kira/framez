import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface StoryCircleProps {
  userName: string;
  userImage?: string;
  hasNewStory?: boolean;
  isCurrentUser?: boolean;
  onPress: () => void;
}

export function StoryCircle({ userName, userImage, hasNewStory = true, isCurrentUser = false, onPress }: StoryCircleProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={[styles.circleWrapper, hasNewStory && styles.circleWrapperActive]}>
        <View style={styles.circle}>
          {userImage ? (
            <Image source={{ uri: userImage }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>{userName[0].toUpperCase()}</Text>
            </View>
          )}
        </View>
        {isCurrentUser && (
          <View style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </View>
        )}
      </View>
      <Text style={styles.userName} numberOfLines={1}>
        {isCurrentUser ? 'Your Story' : userName}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  circleWrapper: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  circleWrapperActive: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  userName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    color: '#333',
  },
});
