-- PayPal 支付系统数据库迁移
-- 运行: npx wrangler d1 execute ket-quiz-db --file=migrate_paypal.sql --remote

-- 1. 更新 users 表，添加订阅相关字段（使用 INSERT OR IGNORE 模式，避免重复添加）
-- 注意：SQLite 不支持 "ADD COLUMN IF NOT EXISTS"，所以我们分开执行

-- 尝试添加 is_pro（忽略错误）
-- ALTER TABLE users ADD COLUMN is_pro INTEGER DEFAULT 0;

-- 尝试添加其他字段（忽略错误）
-- ALTER TABLE users ADD COLUMN subscription_type TEXT;
-- ALTER TABLE users ADD COLUMN subscription_status TEXT;
-- ALTER TABLE users ADD COLUMN pro_expires_at DATETIME;
-- ALTER TABLE users ADD COLUMN paypal_subscription_id TEXT;
-- ALTER TABLE users ADD COLUMN paypal_order_id TEXT;
-- ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 2. 创建 subscriptions 表（订阅记录表）
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  paypal_subscription_id TEXT,
  paypal_order_id TEXT,
  plan_type TEXT NOT NULL, -- 'monthly', 'yearly', 'lifetime'
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- 'pending', 'active', 'cancelled', 'expired', 'refunded'
  started_at DATETIME,
  expires_at DATETIME,
  cancelled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. 创建 paypal_webhooks 表（Webhook 事件记录表）
CREATE TABLE IF NOT EXISTS paypal_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL, -- JSON 格式的完整事件数据
  processed INTEGER DEFAULT 0, -- 0=未处理, 1=已处理, -1=处理失败
  processed_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_paypal_webhooks_event_id ON paypal_webhooks(event_id);
CREATE INDEX IF NOT EXISTS idx_paypal_webhooks_processed ON paypal_webhooks(processed);
