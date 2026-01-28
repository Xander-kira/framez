import { Platform } from "react-native";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase env. Check .env (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)');
}

let supabase: SupabaseClient;

if (Platform.OS === "web") {
  // Web: use default storage (localStorage)
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Native: use AsyncStorage
  require("react-native-url-polyfill/auto");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };