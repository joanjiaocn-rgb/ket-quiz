-- 单独添加 users 表字段
-- 运行: npx wrangler d1 execute ket-quiz-db --file=migrate_users_table.sql --remote

-- 尝试添加字段（一个一个来，出错也没关系）
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- 检查并添加 is_pro
ALTER TABLE users ADD COLUMN is_pro INTEGER DEFAULT 0;

-- 检查并添加 subscription_type
ALTER TABLE users ADD COLUMN subscription_type TEXT;

-- 检查并添加 subscription_status
ALTER TABLE users ADD COLUMN subscription_status TEXT;

-- 检查并添加 pro_expires_at
ALTER TABLE users ADD COLUMN pro_expires_at DATETIME;

-- 检查并添加 paypal_subscription_id
ALTER TABLE users ADD COLUMN paypal_subscription_id TEXT;

-- 检查并添加 paypal_order_id
ALTER TABLE users ADD COLUMN paypal_order_id TEXT;

COMMIT;
PRAGMA foreign_keys=ON;
