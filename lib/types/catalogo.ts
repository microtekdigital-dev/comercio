// =====================================================
// Catálogo Online Types
// =====================================================

export type PlanTier = 'basico' | 'profesional' | 'empresarial';

export interface CatalogSettings {
  id: string;
  company_id: string;
  is_active: boolean;
  primary_color: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnlineOrderItem {
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OnlineOrder {
  id: string;
  company_id: string;
  order_number: string;
  status: 'pendiente' | 'confirmado' | 'rechazado';
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string | null;
  visitor_notes: string | null;
  items: OnlineOrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  confirmed_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
  variant_id: string | null;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  max_stock: number;
}

export interface CatalogoVariant {
  id: string;
  variant_name: string;
  price: number | null;
  stock_quantity: number;
}

export interface CatalogoProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  stock_quantity: number;
  has_variants: boolean;
  variants: CatalogoVariant[];
}

export interface CatalogoPublicoData {
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  settings: CatalogSettings;
  products: CatalogoProduct[];
  plan_tier: PlanTier;
  orders_this_month: number;
}
