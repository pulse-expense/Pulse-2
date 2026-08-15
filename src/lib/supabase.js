import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL || window.PULSE_CONFIG?.url || '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || window.PULSE_CONFIG?.key || '';
export const supabase = url && key ? createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
export const hasSupabase = Boolean(supabase);