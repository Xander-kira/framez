import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function PostCard({
  postId,
  authorId,
  authorName,
  createdAt,
  content,
  imageUrl,
  currentUserId,
  onDelete,
}: {
  postId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  content?: string | null;
  imageUrl?: string | null;
  currentUserId?: string;
  onDelete?: (postId: string) => void;
}) {
  const isOwnPost = currentUserId === authorId;

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(postId),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            {(authorName || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{authorName || 'Unknown'}</Text>
          <Text style={styles.time}>{dayjs(createdAt).fromNow()}</Text>
        </View>
        {isOwnPost && onDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!content && <Text style={styles.content}>{content}</Text>}
      {!!imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#888', alignItems: 'center', justifyContent: 'center', marginRight: 8
  },
  name: { fontWeight: '600' },
  time: { color: '#777', fontSize: 12 },
  content: { marginTop: 4, marginBottom: 8, fontSize: 15 },
  image: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    height: 220,
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: '#eee',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
  },
});
