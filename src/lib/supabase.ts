import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fbpdcwbzkcklaxvqtayd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZicGRjd2J6a2NrbGF4dnF0YXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDg0OTEsImV4cCI6MjA4NDkyNDQ5MX0.9q0OH-gKssCWc_iNS-mSapunSkP7nezGNZn5fS_8_AA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
