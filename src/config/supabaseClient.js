import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kong-production-2e3f.up.railway.app';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM2OTk2NDAwLAogICJleHAiOiAxODk0NzYyODAwCn0.GBMBtbVI5naNDVtg2yG-Ex1AyTKqhtv0Syd4gXL3qSQ';

const supabaseClient = createClient(supabaseUrl, supabaseKey);

export { supabaseClient as supabase };
