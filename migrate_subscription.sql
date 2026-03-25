-- 订阅功能数据库迁移
-- 执行时间：2026-03-25

-- 1. 更新 users 表，添加订阅相关字段
ALTER TABLE users ADD COLUMN is_pro INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN subscription_type TEXT; -- monthly, yearly, lifetime
ALTER TABLE users ADD COLUMN pro_expires_at DATETIME;

-- 2. 创建订阅订单表
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_type TEXT NOT NULL, -- monthly, yearly, lifetime
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'CNY',
  payment_method TEXT,
  payment_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  started_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. 为现有用户设置默认值
UPDATE users SET is_pro = 0 WHERE is_pro IS NULL;
