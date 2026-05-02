import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kpjmjwxcpzcipcxunthq.supabase.co";
const SUPABASE_KEY = "sb_publishable_l-gG5346vDMdZ9qPaoYx2g_OqTfKdTL";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const iphones = [
  { name: 'iPhone XR', price: 1999.00, description: '6.1-inch Liquid Retina display, A12 Bionic chip', category: 'iphones', stock: 10, is_featured: false, image: 'https://images.unsplash.com/photo-1556656793-062ff9878233?w=400' },
  { name: 'iPhone 11', price: 2499.00, description: 'Dual-camera system, A13 Bionic chip', category: 'iphones', stock: 12, is_featured: false, image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400' },
  { name: 'iPhone 12', price: 3299.00, description: '5G speed, A14 Bionic chip, Ceramic Shield', category: 'iphones', stock: 15, is_featured: false, image: 'https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=400' },
  { name: 'iPhone 13', price: 3999.00, description: 'Most advanced dual-camera system ever on iPhone', category: 'iphones', stock: 20, is_featured: true, image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400' },
  { name: 'iPhone 14', price: 4999.00, description: 'Big and bigger. Emergency SOS via satellite', category: 'iphones', stock: 18, is_featured: true, image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=400' },
  { name: 'iPhone 15', price: 5999.00, description: 'New 48MP Camera. USB-C. Dynamic Island', category: 'iphones', stock: 25, is_featured: true, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d256e?w=400' },
  { name: 'iPhone 16 Pro', price: 7999.00, description: 'The ultimate iPhone. A18 Pro chip', category: 'iphones', stock: 30, is_featured: true, image: 'https://images.unsplash.com/photo-1727116192133-1498064a38cc?w=400' },
  { name: 'iPhone 17 Pro (Preview)', price: 9999.00, description: 'Next generation intelligence. Coming soon', category: 'iphones', stock: 5, is_featured: true, image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400' }
];

async function seed() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'sq3junior@gmail.com',
    password: 'Salmos121@',
  });

  if (authError) {
    console.error('Login error:', authError.message);
    return;
  }

  console.log('Logged in as admin. Inserting iPhones...');

  const { data, error } = await supabase
    .from('products')
    .insert(iphones);

  if (error) {
    console.error('Error inserting iPhones:', error.message);
  } else {
    console.log('Successfully inserted iPhones:', data);
  }
}

seed();
