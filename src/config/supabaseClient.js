const dns = require('dns');
const { createClient } = require('@supabase/supabase-js');

// Evita demoras de 2-5s en Windows cuando el ISP anuncia IPv6 sin salida real hacia Cloudflare/Supabase
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false }
};

const dataClient = createClient(supabaseUrl, supabaseKey, clientOptions);

const authClient = createClient(supabaseUrl, supabaseKey, clientOptions);

const adminClient = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, clientOptions)
  : null;

module.exports = { dataClient, authClient, adminClient };
