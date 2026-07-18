const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer the service role key for backend operations to bypass RLS, fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// Initialize Supabase Client for Storage only. Database is accessed via pg.
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
