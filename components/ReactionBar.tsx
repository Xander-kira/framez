import React, { useMemo } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { REACTIONS, ReactionType, countReactions } from "../lib/social";

type Props = {
  reactions: { type: string; user_id: string }[];
  commentsCount: number;
  currentUserId: string;
  onPickReaction: (type: ReactionType) => void;
  onOpenComments: () => void;
};

export default function ReactionBar({
  reactions,
  commentsCount,
  currentUserId,
  onPickReaction,
  onOpenComments,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const { counts, myReaction } = useMemo(() => {
    const counts = countReactions(reactions);
    const mine = reactions.find((r) => r.user_id === currentUserId)?.type ?? null;
    return { counts, myReaction: mine };
  }, [reactions, currentUserId]);

  const reacted = !!myReaction;

  return (
    <View style={{ marginTop: 10 }}>
      {/* Summary row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {REACTIONS.map((r) => {
          const n = counts[r.type] || 0;
          if (!n) return null;
          return (
            <View key={r.type} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
              <Text style={{ opacity: 0.7, fontWeight: "600" }}>{n}</Text>
            </View>
          );
        })}

        <Text style={{ opacity: 0.35 }}>•</Text>
        <Text style={{ opacity: 0.7, fontWeight: "600" }}>{commentsCount} comments</Text>
      </View>

      {/* Action row - IG style */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.06)",
        }}
      >
        {/* React */}
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: pressed ? 0.6 : 1,
            paddingVertical: 6,
            paddingHorizontal: 4,
          })}
        >
          <Feather name="heart" size={18} color={reacted ? "#E11D48" : "#111"} />
          <Text style={{ fontWeight: reacted ? "800" : "700", color: reacted ? "#E11D48" : "#111" }}>
            {reacted ? "Reacted" : "React"}
          </Text>
        </Pressable>

        {/* Comment */}
        <Pressable
          onPress={onOpenComments}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: pressed ? 0.6 : 1,
            paddingVertical: 6,
            paddingHorizontal: 4,
          })}
        >
          <Feather name="message-circle" size={18} color="#111" />
          <Text style={{ fontWeight: "700", color: "#111" }}>Comment</Text>
        </Pressable>
      </View>

      {/* Emoji picker modal */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
        >
          <View
            style={{
              backgroundColor: "#111",
              padding: 16,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
            }}
          >
            <Text style={{ fontWeight: "800", marginBottom: 10, color: "white" }}>
              Choose a reaction
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {REACTIONS.map((r) => (
                <Pressable
                  key={r.type}
                  onPress={() => {
                    onPickReaction(r.type);
                    setOpen(false);
                  }}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor:
                      myReaction === r.type ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
