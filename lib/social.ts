import { supabase } from "./supabase";

// ========================================
// STORIES
// ========================================

export async function createStory(imageUri: string, audioUri?: string | null) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");

  // Upload image to storage
  const ext = imageUri.split('.').pop() || 'jpg';
  const path = `stories/${user.id}/${Date.now()}.${ext}`;

  const response = await fetch(imageUri);
  const blob = await response.blob();

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(path, arrayBuffer, {
      contentType: `image/${ext}`,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('post-images').getPublicUrl(uploadData.path);

  // Upload audio if provided
  let audioUrl: string | null = null;
  if (audioUri) {
    const audioExt = audioUri.split('.').pop() || 'mp3';
    const audioPath = `stories/${user.id}/${Date.now()}.${audioExt}`;

    const audioResponse = await fetch(audioUri);
    const audioBlob = await audioResponse.blob();

    const audioArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(audioBlob);
    });

    const { data: audioUploadData, error: audioUploadError } = await supabase.storage
      .from('post-images')
      .upload(audioPath, audioArrayBuffer, {
        contentType: `audio/${audioExt}`,
        upsert: false,
      });

    if (audioUploadError) throw audioUploadError;

    const {
      data: { publicUrl: audioPublicUrl },
    } = supabase.storage.from('post-images').getPublicUrl(audioUploadData.path);
    audioUrl = audioPublicUrl;
  }

  // Insert story record with 24-hour expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { error: insertError } = await supabase.from('stories').insert({
    user_id: user.id,
    image_url: publicUrl,
    audio_url: audioUrl,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) throw insertError;
  return { success: true };
}

export async function getStories() {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      id,
      image_url,
      audio_url,
      created_at,
      user_id,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group stories by user
  const userStories = data?.reduce((acc: any, story: any) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = {
        user_id: story.user_id,
        full_name: story.profiles?.full_name || 'User',
        avatar_url: story.profiles?.avatar_url,
        stories: [],
      };
    }
    acc[story.user_id].stories.push(story);
    return acc;
  }, {});

  return Object.values(userStories || {});
}

// ========================================
// REACTIONS
// ========================================

export const REACTIONS = [
  { type: "love", emoji: "❤️" },
  { type: "laugh", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "fire", emoji: "🔥" },
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

// ========================================
// COMMENTS
// ========================================

export async function addComment(postId: string, content: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  const { error } = await supabase.from("post_comments").insert({
    post_id: postId,
    user_id: user.id,
    content: trimmed,
  });

  if (error) throw error;

  // Get the post author to send notification
  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  // Don't notify if commenting on own post
  if (post && post.author_id !== user.id) {
    // Get commenter's name
    const { data: commenterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Create notification for post author
    await supabase.from("notifications").insert({
      user_id: post.author_id,
      type: "comment",
      message: `${commenterProfile?.full_name || 'Someone'} commented on your post`,
      read: false,
    });
  }

  return { success: true };
}

export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from("post_comments")
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Normalize profiles (can be array or object depending on Supabase version)
  return (data ?? []).map((comment: any) => ({
    ...comment,
    profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
  }));
}

// ========================================
// FOLLOWS
// ========================================

export async function followUser(userId: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");
  if (user.id === userId) throw new Error("Cannot follow yourself");

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: userId,
  });

  if (error) throw error;

  // Get follower's name for notification
  const { data: followerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Create notification for the user being followed
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "follow",
    message: `${followerProfile?.full_name || 'Someone'} started following you`,
    read: false,
  });

  return { success: true };
}

export async function unfollowUser(userId: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId);

  if (error) throw error;
  return { success: true };
}

export async function getFollowStatus(userId: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return { isFollowing: false };

  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .maybeSingle();

  if (error) return { isFollowing: false };
  return { isFollowing: !!data };
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserPosts(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      image_url,
      audio_url,
      created_at,
      author_id,
      profiles:author_id (
        full_name,
        avatar_url
      ),
      post_reactions(type, user_id),
      post_comments(id)
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((post) => ({
    ...post,
    post_comments: Array.isArray(post.post_comments) ? post.post_comments : [],
    post_reactions: Array.isArray(post.post_reactions) ? post.post_reactions : [],
  }));
}

export async function searchUsers(query: string) {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio")
    .ilike("full_name", `%${query}%`)
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function updateProfile(bio: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio.trim() || null })
    .eq("id", user.id);

  if (error) throw error;
  return { success: true };
}

// ========================================
// SAVED POSTS
// ========================================

export async function savePost(postId: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("saved_posts").insert({
    user_id: user.id,
    post_id: postId,
  });

  if (error) throw error;
  return { success: true };
}

export async function unsavePost(postId: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("saved_posts")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", postId);

  if (error) throw error;
  return { success: true };
}

export async function getSavedPosts() {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("saved_posts")
    .select(`
      post_id,
      created_at,
      posts (
        id,
        content,
        image_url,
        audio_url,
        created_at,
        author_id,
        profiles:author_id (
          full_name,
          avatar_url
        ),
        post_reactions(type, user_id),
        post_comments(id)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item.posts,
    post_comments: Array.isArray(item.posts?.post_comments) ? item.posts.post_comments : [],
    post_reactions: Array.isArray(item.posts?.post_reactions) ? item.posts.post_reactions : [],
  }));
}

export async function isSaved(postId: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return { saved: false };

  const { data, error } = await supabase
    .from("saved_posts")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (error) return { saved: false };
  return { saved: !!data };
}
