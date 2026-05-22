import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://brvsmhbfnvswoikanxat.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydnNtaGJmbnZzd29pa2FueGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODE5OTksImV4cCI6MjA2MzU1Nzk5OX0.XsSlltwChflbUdkOLRon0OSgeSbYdZkH1917Mwlibio'

export const supabase = createClient(supabaseUrl, supabaseKey)
