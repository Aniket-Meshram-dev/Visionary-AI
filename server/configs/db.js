import supabaseAdmin from './supabase.js';

/**
 * Supabase Database Client Export
 * Central database access point for all queries and mutations
 */
export const db = supabaseAdmin;
export default supabaseAdmin;