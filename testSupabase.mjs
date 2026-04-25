import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kpjmjwxcpzcipcxunthq.supabase.co";
const SUPABASE_KEY = "sb_publishable_l-gG5346vDMdZ9qPaoYx2g_OqTfKdTL";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUpload() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'sq3junior@gmail.com',
    password: 'Salmos121@',
  });

  if (authError) {
    console.error('Login error:', authError.message);
    return;
  }
  
  // Create a dummy text file to upload
  const fileContent = new Blob(['Hello World!'], { type: 'text/plain' });
  const fileName = `test_file_${Date.now()}.txt`;
  
  console.log('Trying to upload to product-images...');
  const { data, error } = await supabase.storage.from('product-images').upload(fileName, fileContent);
  
  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success!', data);
  }
}

testUpload();
