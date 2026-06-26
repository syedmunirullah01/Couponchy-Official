// CommonJS seed script for Supabase admin seeding
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Fix DNS SRV resolution on Windows
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
let envConfig = {};
try {
  envConfig = fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .reduce((acc, line) => {
      const match = line.match(/^([^=\s]+)=(.*)$/);
      if (match) acc[match[1].trim()] = match[2].trim();
      return acc;
    }, {});
} catch (e) {
  console.warn('Could not read .env.local file. Proceeding with system environment variables.');
}

process.env = { ...process.env, ...envConfig };

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env.local');
      process.exit(1);
    }

    console.log('Checking if admin user exists with email:', adminEmail);

    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to query users table: ${findError.message}`);
    }

    if (existing) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        name: 'Primary Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        permissions: ['all'],
        is_active: true,
      });

    if (insertError) {
      throw new Error(`Failed to insert admin: ${insertError.message}`);
    }

    console.log('Admin user seeded successfully into Supabase!');
  } catch (err) {
    console.error('Error seeding admin user:', err.message || err);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
