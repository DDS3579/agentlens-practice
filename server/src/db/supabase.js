import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

let supabaseClient

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. Using dummy client.')
  supabaseClient = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: new Error('Dummy client - no credentials configured') }),
      insert: () => Promise.resolve({ data: null, error: new Error('Dummy client - no credentials configured') }),
      update: () => Promise.resolve({ data: null, error: new Error('Dummy client - no credentials configured') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Dummy client - no credentials configured') }),
      upsert: () => Promise.resolve({ data: null, error: new Error('Dummy client - no credentials configured') }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: null, error: new Error('Dummy client - no credentials configured') }),
    },
    rpc: () => Promise.resolve({ data: null, error: new Error('Dummy client - no credentials configured') }),
  }
} else {
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const supabase = supabaseClient

// export async function testSupabaseConnection() {
//   try {
//     if (!supabaseUrl || !supabaseServiceKey) {
//       return { ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables' }
//     }

//     const { data, error } = await supabase
//       .from('users')
//       .select('1')
//       .limit(1)

//     if (error) {
//       return { ok: false, error: error.message }
//     }

//     console.log('[Supabase] Connected successfully')
//     return { ok: true }
//   } catch (err) {
//     return { ok: false, error: err.message }
//   }
// }

export async function testSupabaseConnection() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Supabase] Missing environment variables');
      return { ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables' }
    }

    // Use head: true to just check connection without fetching data
    const { error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('[Supabase] Query error:', error.message);
      return { ok: false, error: error.message }
    }

    console.log(`[Supabase] Connected successfully (found ${count || 0} users)`)
    return { ok: true, count }
  } catch (err) {
    console.error('[Supabase] Connection error:', err);
    return { ok: false, error: err.message }
  }
}
