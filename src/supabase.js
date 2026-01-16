import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kdfltskvxjrnlyjzivle.supabase.co";
const supabaseAnonKey =
  "sb_publishable_9wqx92a4rW6ogE7TgLqFrg_AnGILwEs";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
