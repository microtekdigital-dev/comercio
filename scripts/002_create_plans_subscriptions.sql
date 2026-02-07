-- Plans table: defines available subscription plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  interval TEXT NOT NULL DEFAULT 'month', -- 'month', 'year'
  interval_count INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table: tracks company subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'cancelled', 'expired'
  mp_subscription_id TEXT, -- MercadoPago subscription ID
  mp_preapproval_id TEXT, -- MercadoPago preapproval ID for recurring
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table: tracks individual payment transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  mp_payment_id TEXT, -- MercadoPago payment ID
  mp_preference_id TEXT, -- MercadoPago preference ID
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'refunded'
  payment_type TEXT, -- 'one_time', 'subscription'
  payment_method TEXT, -- 'credit_card', 'debit_card', 'account_money', etc.
  external_reference TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON public.payments(mp_payment_id);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans (anyone can read active plans)
CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);

-- RLS Policies for subscriptions (only company members can view their subscriptions)
CREATE POLICY "Company members can view their subscriptions" ON public.subscriptions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for payments (only company members can view their payments)
CREATE POLICY "Company members can view their payments" ON public.payments
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    )
  );

-- Insert default plans
INSERT INTO public.plans (name, description, price, currency, interval, features, sort_order) VALUES
  ('Básico', 'Ideal para pequeños equipos', 2999.00, 'ARS', 'month', 
   '["Hasta 5 usuarios", "1 GB de almacenamiento", "Soporte por email"]'::jsonb, 1),
  ('Profesional', 'Para equipos en crecimiento', 7999.00, 'ARS', 'month', 
   '["Hasta 25 usuarios", "10 GB de almacenamiento", "Soporte prioritario", "Reportes avanzados"]'::jsonb, 2),
  ('Empresarial', 'Solución completa para grandes empresas', 19999.00, 'ARS', 'month', 
   '["Usuarios ilimitados", "100 GB de almacenamiento", "Soporte 24/7", "API access", "SSO"]'::jsonb, 3)
ON CONFLICT DO NOTHING;
