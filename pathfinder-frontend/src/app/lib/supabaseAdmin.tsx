import { createClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be imported on the server');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServerKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or anon key in .env');
}

if (!supabaseServerKey) {
    // NOTE (HALF): Server key should never be in .env as our repo is open source
    throw new Error('Missing Supabase server key in .env.local');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServerKey);

export async function getUserFromSessionToken(token: string) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        }
    );
    return await supabase.auth.getUser();
}
