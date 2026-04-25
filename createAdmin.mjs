import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kpjmjwxcpzcipcxunthq.supabase.co";
const SUPABASE_KEY = "sb_publishable_l-gG5346vDMdZ9qPaoYx2g_OqTfKdTL";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createAdmin() {
  const emailToUse = 'sq3junior@gmail.com'; 
  console.log(`Trying to create user: [${emailToUse}]`);
  const { data, error } = await supabase.auth.signUp({
    email: emailToUse,
    password: 'Salmos121@',
    options: {
      data: {
        full_name: 'Junior (Admin)',
        role: 'admin'
      }
    }
  });

  if (error) {
    console.error('Erro ao criar admin:', error.message);
  } else {
    console.log('Admin criado com sucesso!', data.user?.email);
  }
}

createAdmin();
