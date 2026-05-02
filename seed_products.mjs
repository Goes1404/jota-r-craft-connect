import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kpjmjwxcpzcipcxunthq.supabase.co";
const SUPABASE_KEY = "sb_publishable_l-gG5346vDMdZ9qPaoYx2g_OqTfKdTL";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const products = [
  // Smartphones
  { name: 'iPhone 15 Pro Max', price: 9500.00, description: 'Titânio. A17 Pro. O iPhone mais poderoso já criado.', category: 'Smartphone', stock: 10, is_featured: true, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d256e?w=400' },
  { name: 'Samsung Galaxy S24 Ultra', price: 8500.00, description: 'Galaxy AI. Câmera de 200MP. O auge do Android.', category: 'Smartphone', stock: 5, is_featured: true, image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400' },
  { name: 'Xiaomi 14 Pro', price: 5500.00, description: 'Lentes Leica. HyperOS. Desempenho extremo.', category: 'Smartphone', stock: 12, is_featured: false, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400' },
  
  // Watches
  { name: 'Apple Watch Ultra 2', price: 6500.00, description: 'O relógio esportivo definitivo. Tela mais brilhante.', category: 'Watch', stock: 8, is_featured: true, image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400' },
  { name: 'Samsung Galaxy Watch 6', price: 1800.00, description: 'Monitoramento de saúde avançado com design clássico.', category: 'Watch', stock: 15, is_featured: false, image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400' },
  
  // Audio
  { name: 'AirPods Pro 2', price: 2000.00, description: 'Cancelamento ativo de ruído até 2x melhor.', category: 'Audio', stock: 20, is_featured: true, image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400' },
  { name: 'Sony WH-1000XM5', price: 2500.00, description: 'O melhor cancelamento de ruído do mercado em formato over-ear.', category: 'Audio', stock: 7, is_featured: false, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400' },
  
  // Protection
  { name: 'Capa de Couro MagSafe iPhone 15', price: 450.00, description: 'Couro premium europeu com suporte a MagSafe.', category: 'Protection', stock: 50, is_featured: false, image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400' },
  { name: 'Película de Vidro Safira S24 Ultra', price: 150.00, description: 'Resistência extrema contra riscos e quedas.', category: 'Protection', stock: 100, is_featured: false, image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },

  // Power
  { name: 'Carregador MagSafe', price: 350.00, description: 'Carregamento sem fio rápido e prático para seu iPhone.', category: 'Power', stock: 30, is_featured: true, image: 'https://images.unsplash.com/photo-1615526653616-92f588c22ab8?w=400' },
  { name: 'Powerbank Baseus 20000mAh', price: 280.00, description: 'Alta capacidade com carregamento rápido de 65W.', category: 'Power', stock: 25, is_featured: false, image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400' }
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

  console.log('Logged in as admin. Inserting products...');

  const { data, error } = await supabase
    .from('products')
    .insert(products);

  if (error) {
    console.error('Error inserting products:', error.message);
  } else {
    console.log('Successfully inserted products:', data);
  }
}

seed();
