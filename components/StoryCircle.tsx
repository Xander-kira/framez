import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  userName: string;
  userImage?: string;
  thumbnailUrl?: string;
  hasViewed?: boolean;
  isCurrentUser?: boolean;
  onPress: () => void;
};

export function StoryCircle({ userName, userImage, thumbnailUrl, hasViewed, isCurrentUser, onPress }: Props) {
  const displayImage = thumbnailUrl || userImage;
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.circleWrapper}>
        {!hasViewed ? (
          <LinearGradient
            colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.innerCircle}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{userName[0]?.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.gradient, styles.viewedGradient]}>
            <View style={styles.innerCircle}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{userName[0]?.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {isCurrentUser && (
          <View style={styles.plusBadge}>
            <Text style={styles.plusText}>+</Text>
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
    marginRight: 12,
    width: 72,
  },
  circleWrapper: {
    position: 'relative',
  },
  gradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewedGradient: {
    backgroundColor: '#E0E0E0',
  },
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  userName: {
    marginTop: 4,
    fontSize: 12,
    color: '#262626',
    textAlign: 'center',
    width: '100%',
  },
});
