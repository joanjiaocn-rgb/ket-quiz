-- KET Quiz 用户体系数据库迁移脚本 v2
-- 运行: npx wrangler d1 execute ket-quiz-db --file=migrate_user_system_v2.sql --remote

-- 1. 优化 users 表，添加新字段
-- SQLite 不允许 DEFAULT CURRENT_TIMESTAMP 给已有表加列，所以先不加默认值
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN level INTEGER;
ALTER TABLE users ADD COLUMN total_points INTEGER;
ALTER TABLE users ADD COLUMN updated_at DATETIME;

-- 给现有用户设置默认值
UPDATE users SET level = 1 WHERE level IS NULL;
UPDATE users SET total_points = 0 WHERE total_points IS NULL;

-- 2. 创建 user_profiles 表（用户详细信息）
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  birth_date DATE,
  gender TEXT,
  country TEXT,
  city TEXT,
  target_score INTEGER,
  study_goal TEXT,
  preferred_learning_time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. 创建 user_statistics 表（学习统计）
CREATE TABLE IF NOT EXISTS user_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  total_questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_study_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. 创建 achievements 表（成就定义）
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  type TEXT NOT NULL,
  requirement INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 创建 user_achievements 表（用户成就关联）
CREATE TABLE IF NOT EXISTS user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id),
  UNIQUE(user_id, achievement_id)
);

-- 6. 创建 user_settings 表（用户设置）
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  notifications_enabled INTEGER DEFAULT 1,
  sound_enabled INTEGER DEFAULT 1,
  auto_play_audio INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'zh-CN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. 插入预设成就数据
INSERT OR IGNORE INTO achievements (name, description, icon, type, requirement, points_reward) VALUES
('初学者', '完成 10 道题目', '🎯', 'questions', 10, 50),
('练习达人', '完成 50 道题目', '⭐', 'questions', 50, 100),
('词汇达人', '答对 50 道词汇题', '📚', 'vocabulary', 50, 150),
('语法大师', '答对 50 道语法题', '📝', 'grammar', 50, 150),
('勤奋学习者', '连续学习 7 天', '🔥', 'streak', 7, 200),
('坚持之星', '连续学习 30 天', '🏆', 'streak', 30, 500),
('全能选手', '所有题型都练习过', '🌟', 'all_types', 1, 300),
('完美主义者', '连续答对 20 道题', '💯', 'consecutive_correct', 20, 250);
