/* ==========================================================================
   Supabase Configuration & Client Initialization
   Ushaq Ul Quran Academy
   ========================================================================== */

// Official Production Supabase Credentials for your project
// ONLY the Publishable/Anon key is used on the client-side for strict security.
const DEFAULT_SUPABASE_URL = "https://yraqcuqadrcnjasgtrwc.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_U1zEgUg_VHTltzhGk18s_w_otdpmlai";

// Retrieve configured credentials (or fallback to defaults)
function getSupabaseConfig() {
  const url = localStorage.getItem('supabase_url') || DEFAULT_SUPABASE_URL;
  const anonKey = localStorage.getItem('supabase_key') || DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

// Global Supabase Client
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.warn("Supabase library not loaded yet.");
    return null;
  }
  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      supabaseClient = supabase.createClient(config.url, config.anonKey);
      return supabaseClient;
    } catch (e) {
      console.error("Error creating Supabase client:", e);
      return null;
    }
  }
  return null;
}

// Auto-initialize when Supabase CDN script finishes loading
if (typeof supabase !== 'undefined') {
  initSupabase();
}
