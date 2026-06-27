import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('raw_opportunities')
    .select('status, id');
  
  const stats = {};
  for (const row of data || []) {
      stats[row.status] = (stats[row.status] || 0) + 1;
  }
  console.log('Stats:', stats);
  
  const { data: recent } = await supabase
    .from('raw_opportunities')
    .select('id, status, raw_data, created_at')
    .eq('status', 'skipped')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Skipped examples:', JSON.stringify(recent, null, 2));

  const { data: duplicate } = await supabase
    .from('raw_opportunities')
    .select('id, status, raw_data, created_at')
    .eq('status', 'duplicate')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Duplicate examples:', JSON.stringify(duplicate, null, 2));
}

run();
