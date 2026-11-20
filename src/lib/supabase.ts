import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

// Polyfill WebSocket for Node.js environments (< Node 22)
if (typeof window === 'undefined' && typeof (globalThis as unknown as { WebSocket?: unknown }).WebSocket === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require('ws');
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = ws;
  } catch {
    // Browser or environment where ws isn't needed
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Standard options without realtime overhead
const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

// Client for public frontend / anonymous interactions
export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// Admin client for backend server actions & ingestion scripts (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, clientOptions);
