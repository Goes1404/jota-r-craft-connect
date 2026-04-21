export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  description?: string;
  detailed_description?: string;
  image: string;
  images?: string[];
  category: string;
  stock: number;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  cost_at_sale?: number;
  total_price: number;
  sale_date: string;
  category: string;
  responsible_user_id: string;
  sale_type: 'manual' | 'automatic';
  notes: string;
  product?: {
    name: string;
    category: string;
    cost: number;
  };
}

export interface SalesSummary {
  total_sales_value: number;
  total_quantity_sold: number;
  total_transactions: number;
  best_selling_product_name: string;
  best_selling_quantity: number;
  most_profitable_product_name: string;
  most_profitable_profit: number;
}

export interface AppSettings {
  hero_image?: string;
  story_image?: string;
  whatsapp_number?: string;
  [key: string]: string | undefined;
}
