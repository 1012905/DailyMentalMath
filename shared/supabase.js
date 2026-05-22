import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env\n" +
    "Auth and cloud sync features will be disabled."
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function isSupabaseReady() {
  return supabase !== null;
}

export async function signUp(email, password) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export function onAuthStateChanged(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event);
  });
  return data?.subscription?.unsubscribe || (() => {});
}

export async function getProfile(userId) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function upsertProfile(profile) {
  if (!supabase) return;
  await supabase.from("profiles").upsert(profile, { onConflict: "id" });
}

export async function savePracticeSession(session) {
  if (!supabase) return;
  await supabase.from("practice_sessions").insert(session);
}

export async function getPracticeSessions(userId, limit = 50) {
  if (!supabase) return [];
  const { data } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function syncAchievements(userId, achievements) {
  if (!supabase) return;
  const rows = achievements.map((a) => ({
    user_id: userId,
    achievement_id: a.id,
    unlocked_at: a.unlockedAt || new Date().toISOString(),
    progress: a.progress || 0,
    max_progress: a.maxProgress || 1,
  }));
  await supabase.from("achievements").delete().eq("user_id", userId);
  if (rows.length > 0) {
    await supabase.from("achievements").insert(rows);
  }
}

export async function submitDailyScore(userId, score, accuracy, time) {
  if (!supabase) return;
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("daily_scores").upsert(
    { user_id: userId, date: today, score, accuracy, time },
    { onConflict: "user_id, date" }
  );
}

export async function getDailyLeaderboard(dateStr, limit = 20) {
  if (!supabase) return [];
  const date = dateStr || new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_scores")
    .select("*, profiles(username, avatar_url)")
    .eq("date", date)
    .order("score", { ascending: false })
    .limit(limit);
  return data || [];
}
