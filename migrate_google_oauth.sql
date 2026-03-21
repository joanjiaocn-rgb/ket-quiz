-- 迁移脚本：为已有数据库添加 Google OAuth 支持字段
-- Run: npx wrangler d1 execute ket-quiz-db --remote --file=migrate_google_oauth.sql

ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN avatar TEXT;

-- 允许 password 字段为 NULL（Google 用户无密码）
-- 注意：SQLite 不支持直接修改列约束，已有的 NOT NULL 限制需通过新建表方式处理
-- 如果 ALTER 报错，改用下面的方式（重建表）：

-- CREATE TABLE users_new (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   username TEXT UNIQUE NOT NULL,
--   password TEXT,
--   google_id TEXT UNIQUE,
--   email TEXT,
--   avatar TEXT,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );
-- INSERT INTO users_new (id, username, password, created_at) SELECT id, username, password, created_at FROM users;
-- DROP TABLE users;
-- ALTER TABLE users_new RENAME TO users;
