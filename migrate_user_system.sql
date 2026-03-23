-- KET Quiz 用户体系数据库迁移脚本
-- 运行: npx wrangler d1 execute ket-quiz-db --file=migrate_user_system.sql

-- 1. 优化 users 表，添加新字段
-- 注意：SQLite 不支持直接添加多列，需要分批执行
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

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
INSERT INTO achievements (name, description, icon, type, requirement, points_reward) VALUES
('初学者', '完成 10 道题目', '🎯', 'questions', 10, 50),
('练习达人', '完成 50 道题目', '⭐', 'questions', 50, 100),
('词汇达人', '答对 50 道词汇题', '📚', 'vocabulary', 50, 150),
('语法大师', '答对 50 道语法题', '📝', 'grammar', 50, 150),
('勤奋学习者', '连续学习 7 天', '🔥', 'streak', 7, 200),
('坚持之星', '连续学习 30 天', '🏆', 'streak', 30, 500),
('全能选手', '所有题型都练习过', '🌟', 'all_types', 1, 300),
('完美主义者', '连续答对 20 道题', '💯', 'consecutive_correct', 20, 250);

-- 8. 为现有用户初始化统计数据和设置
-- 注意：这需要在应用层处理，或者用更复杂的 SQL
-- 应用启动时会自动为没有统计数据的用户创建记录
