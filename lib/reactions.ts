import { supabase } from "./supabase";

export const REACTIONS = [
  { type: "love", emoji: "❤️" },
  { type: "laugh", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "fire", emoji: "🔥" },
  { type: "thumbs_up", emoji: "👍" },
  { type: "thumbs_down", emoji: "👎" },
  { type: "clap", emoji: "👏" },
  { type: "party", emoji: "🥳" },
  { type: "thinking", emoji: "🤔" },
  { type: "celebrate", emoji: "🎉" },
  
] as const;

export type ReactionType = (typeof REACTIONS)[number]["type"];

export function countReactions(rows: { type: string }[]) {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.type] = (map[r.type] || 0) + 1;
  return map;
}

export async function toggleReaction(postId: string, type: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");

  // 1) check existing reaction
  const { data: existing, error: checkErr } = await supabase
    .from("post_reactions")
    .select("id,type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (checkErr) throw checkErr;

  // 2) if same reaction exists -> remove it (toggle off)
  if (existing && existing.type === type) {
    const { error: delErr } = await supabase
      .from("post_reactions")
      .delete()
      .eq("id", existing.id);

    if (delErr) throw delErr;
    return { action: "deleted" as const };
  }

  // 3) if reaction exists but different type -> update
  if (existing) {
    const { error: updErr } = await supabase
      .from("post_reactions")
      .update({ type })
      .eq("id", existing.id);

    if (updErr) throw updErr;
    return { action: "updated" as const };
  }

  // 4) no reaction yet -> insert
  const { error: insErr } = await supabase.from("post_reactions").insert({
    post_id: postId,
    user_id: user.id,
    type,
  });

  if (insErr) throw insErr;
  return { action: "inserted" as const };
}
