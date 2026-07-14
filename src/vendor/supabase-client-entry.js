import { createClient } from '@supabase/supabase-js';

const api = Object.freeze({ createClient });

globalThis.RadarSupabaseClient = api;
globalThis.supabase = api;

export { createClient };
