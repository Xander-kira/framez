import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

type Notif = {
  id: string;
  type: "reaction" | "comment";
  post_id: string;
  actor_id: string;
  read: boolean;
  created_at: string;
  meta: any;
};

export default function Notifications() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("id,type,post_id,actor_id,read,created_at,meta")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) setItems((data ?? []) as Notif[]);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => {
          const text =
            item.type === "reaction"
              ? `Someone reacted: ${item.meta?.reaction ?? ""}`
              : `New comment: ${item.meta?.preview ?? ""}`;

          return (
            <Pressable
              onPress={async () => {
                await markRead(item.id);
                router.push(`/comments/${item.post_id}`);
              }}
              style={[styles.card, !item.read && styles.unread]}
            >
              <Text style={styles.cardText}>{text}</Text>
              <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={{ opacity: 0.7 }}>No notifications yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 12 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#eee", marginBottom: 10 },
  unread: { borderColor: "#007AFF" },
  cardText: { fontWeight: "700", marginBottom: 6 },
  time: { fontSize: 12, opacity: 0.6 },
});
