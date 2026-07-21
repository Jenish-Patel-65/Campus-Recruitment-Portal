const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Initialize Supabase Client for Storage only. Database is accessed via pg.
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
