export interface User {
  id: number;
  username: string;
  full_name: string;
  restaurant_id: number;
  is_active: boolean;
}

export interface Table {
  id: number;
  table_number: string;
  seats: number;
  status: "FREE" | "OCCUPIED" | "RESERVED";
  is_active: boolean;
  restaurant_id: number;
}

export interface Category {
  id: number;
  name: string;
  is_active: boolean;
  restaurant_id: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  unit: string;
  image_url: string | null;
  category_id: number;
  is_active: boolean;
  restaurant_id: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  table_id: number;
  cashier_id: number;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  total_amount: number;
  created_at: string;
  updated_at: string | null;
  items: OrderItem[];
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: "CASH" | "CARD" | "CLICK" | "PAYME";
  status: "PENDING" | "COMPLETED" | "FAILED";
  created_at: string;
}

export interface DashboardStats {
  today_revenue: number;
  today_orders_count: number;
  average_check: number;
}
