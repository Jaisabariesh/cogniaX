// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://YOUR_PROJECT.supabase.co'
const supabaseKey = 'YOUR_PUBLIC_ANON_KEY' // from Supabase Project Settings

export const supabase = createClient(supabaseUrl, supabaseKey)
