import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using anon key for mock

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRows() {
  const { data, error } = await supabase
    .from('system_updates')
    .select('*');

  if (error) {
    console.error('Error fetching system updates:', error);
  } else {
    console.log('System updates found:', data);
  }
}

checkRows();
