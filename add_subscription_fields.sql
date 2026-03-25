ALTER TABLE users ADD COLUMN subscription_type TEXT;
ALTER TABLE users ADD COLUMN subscription_status TEXT;
ALTER TABLE users ADD COLUMN pro_expires_at DATETIME;
ALTER TABLE users ADD COLUMN paypal_subscription_id TEXT;
ALTER TABLE users ADD COLUMN paypal_order_id TEXT;