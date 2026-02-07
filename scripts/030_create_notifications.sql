-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'low_stock', 'pending_payment', 'new_sale', 'payment_received', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500), -- Optional link to related resource
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  metadata JSONB -- Additional data like product_id, sale_id, etc.
);

-- Create indexes
CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  low_stock_enabled BOOLEAN DEFAULT TRUE,
  pending_payment_enabled BOOLEAN DEFAULT TRUE,
  new_sale_enabled BOOLEAN DEFAULT TRUE,
  payment_received_enabled BOOLEAN DEFAULT TRUE,
  system_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Function to create low stock notifications
CREATE OR REPLACE FUNCTION check_low_stock_notifications()
RETURNS void AS $$
DECLARE
  product_record RECORD;
  notification_exists BOOLEAN;
BEGIN
  FOR product_record IN 
    SELECT p.id, p.name, p.stock_quantity, p.min_stock_level, p.company_id
    FROM products p
    WHERE p.track_inventory = TRUE 
      AND p.is_active = TRUE
      AND p.stock_quantity <= p.min_stock_level
  LOOP
    -- Check if notification already exists for this product
    SELECT EXISTS(
      SELECT 1 FROM notifications 
      WHERE company_id = product_record.company_id
        AND type = 'low_stock'
        AND metadata->>'product_id' = product_record.id::text
        AND is_read = FALSE
        AND created_at > NOW() - INTERVAL '24 hours'
    ) INTO notification_exists;
    
    -- Create notification if it doesn't exist
    IF NOT notification_exists THEN
      INSERT INTO notifications (company_id, type, title, message, priority, metadata, link)
      VALUES (
        product_record.company_id,
        'low_stock',
        'Stock Bajo',
        'El producto "' || product_record.name || '" tiene stock bajo (' || product_record.stock_quantity || ' unidades)',
        'high',
        jsonb_build_object('product_id', product_record.id, 'stock_quantity', product_record.stock_quantity),
        '/dashboard/products/' || product_record.id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create pending payment notifications
CREATE OR REPLACE FUNCTION check_pending_payment_notifications()
RETURNS void AS $$
DECLARE
  sale_record RECORD;
  notification_exists BOOLEAN;
  days_pending INTEGER;
BEGIN
  FOR sale_record IN 
    SELECT s.id, s.sale_number, s.company_id, s.sale_date, s.total,
           COALESCE(SUM(sp.amount), 0) as paid_amount,
           c.name as customer_name
    FROM sales s
    LEFT JOIN sale_payments sp ON s.id = sp.sale_id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.status IN ('pending', 'confirmed')
    GROUP BY s.id, s.sale_number, s.company_id, s.sale_date, s.total, c.name
    HAVING s.total > COALESCE(SUM(sp.amount), 0)
  LOOP
    days_pending := EXTRACT(DAY FROM NOW() - sale_record.sale_date);
    
    -- Only notify for sales older than 3 days
    IF days_pending >= 3 THEN
      SELECT EXISTS(
        SELECT 1 FROM notifications 
        WHERE company_id = sale_record.company_id
          AND type = 'pending_payment'
          AND metadata->>'sale_id' = sale_record.id::text
          AND is_read = FALSE
          AND created_at > NOW() - INTERVAL '7 days'
      ) INTO notification_exists;
      
      IF NOT notification_exists THEN
        INSERT INTO notifications (company_id, type, title, message, priority, metadata, link)
        VALUES (
          sale_record.company_id,
          'pending_payment',
          'Pago Pendiente',
          'La venta #' || sale_record.sale_number || ' tiene pagos pendientes (' || days_pending || ' días)',
          CASE WHEN days_pending > 30 THEN 'urgent' WHEN days_pending > 15 THEN 'high' ELSE 'normal' END,
          jsonb_build_object('sale_id', sale_record.id, 'days_pending', days_pending, 'amount_pending', sale_record.total - sale_record.paid_amount),
          '/dashboard/sales/' || sale_record.id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their company notifications"
  ON notifications FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());
