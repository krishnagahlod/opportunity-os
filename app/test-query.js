import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('raw_opportunities')
    .select('status, count(id)')
    .group('status');
  console.log('Stats:', data, error);
  
  const { data: recent, error: e2 } = await supabase
    .from('raw_opportunities')
    .select('id, title, status, raw_data')
    .eq('status', 'skipped')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Skipped examples:', JSON.stringify(recent, null, 2));
}

run();
