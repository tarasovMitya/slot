import { createClient } from "@supabase/supabase-js";

const w = window as unknown as { __env__?: { VITE_SUPABASE_ANON_KEY?: string } };
const supabaseAnonKey = w.__env__?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// All Supabase requests go through our own server proxy to bypass regional blocking
const supabaseUrl = import.meta.env.DEV
  ? (import.meta.env.VITE_SUPABASE_URL as string)
  : `${window.location.origin}/supabase-proxy`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
