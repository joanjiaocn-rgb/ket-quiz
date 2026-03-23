# KET Quiz 用户体系设计文档

## 1. 概述

为 KET 冲刺小站设计一套完整的用户体系，支持 Google OAuth 2.0 登录和传统账号密码登录，提供个人中心功能。

## 2. 数据库设计

### 2.1 users 表（已存在，需要优化）

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  google_id TEXT UNIQUE,
  email TEXT,
  avatar TEXT,
  display_name TEXT,        -- 显示名称
  bio TEXT,                  -- 个人简介
  level INTEGER DEFAULT 1,   -- 用户等级
  total_points INTEGER DEFAULT 0,  -- 总积分
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 user_profiles 表（新增，用户详细信息）

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  birth_date DATE,           -- 生日
  gender TEXT,               -- 性别
  country TEXT,              -- 国家
  city TEXT,                 -- 城市
  target_score INTEGER,      -- 目标分数
  study_goal TEXT,           -- 学习目标
  preferred_learning_time TEXT,  -- 偏好学习时间
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.3 user_statistics 表（新增，学习统计）

```sql
CREATE TABLE IF NOT EXISTS user_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  total_questions_answered INTEGER DEFAULT 0,  -- 总答题数
  correct_answers INTEGER DEFAULT 0,            -- 正确答题数
  total_sessions INTEGER DEFAULT 0,             -- 总练习场次
  total_study_time INTEGER DEFAULT 0,           -- 总学习时间（秒）
  streak_days INTEGER DEFAULT 0,                 -- 连续学习天数
  last_study_date DATE,                          -- 最后学习日期
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.4 achievements 表（新增，成就系统）

```sql
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- 成就名称
  description TEXT,              -- 成就描述
  icon TEXT,                     -- 成就图标
  type TEXT NOT NULL,            -- 成就类型（答题、连续学习、等）
  requirement INTEGER NOT NULL,  -- 达成要求
  points_reward INTEGER DEFAULT 0  -- 积分奖励
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id),
  UNIQUE(user_id, achievement_id)
);
```

### 2.5 user_settings 表（新增，用户设置）

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  notifications_enabled INTEGER DEFAULT 1,      -- 是否启用通知
  sound_enabled INTEGER DEFAULT 1,               -- 是否启用声音
  auto_play_audio INTEGER DEFAULT 0,             -- 是否自动播放音频
  theme TEXT DEFAULT 'light',                    -- 主题
  language TEXT DEFAULT 'zh-CN',                 -- 语言
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 3. API 设计

### 3.1 用户信息相关

- `GET /api/user/profile` - 获取当前用户信息
- `PUT /api/user/profile` - 更新用户信息
- `GET /api/user/statistics` - 获取用户学习统计
- `PUT /api/user/settings` - 更新用户设置

### 3.2 成就系统相关

- `GET /api/achievements` - 获取所有成就列表
- `GET /api/user/achievements` - 获取用户已解锁的成就
- `POST /api/user/achievements/check` - 检查是否达成新成就

### 3.3 排行榜相关

- `GET /api/leaderboard` - 获取排行榜

## 4. 前端页面设计

### 4.1 个人中心页面 (profile.html)

包含以下模块：
1. 用户基本信息展示（头像、用户名、等级、积分）
2. 学习统计卡片（总答题数、正确率、连续学习天数等）
3. 成就展示区
4. 个人资料编辑区
5. 设置区

### 4.2 导航栏更新

在现有导航栏中添加：
- 用户头像下拉菜单
- 个人中心入口
- 设置入口
- 退出登录

## 5. 功能特性

### 5.1 用户等级系统

- 等级 1: 0-99 分
- 等级 2: 100-299 分
- 等级 3: 300-599 分
- 等级 4: 600-999 分
- 等级 5: 1000+ 分

### 5.2 积分系统

- 答对一题: +10 分
- 完成一个练习 session: +20 分
- 连续学习 7 天: +100 分
- 解锁成就: 根据成就配置奖励

### 5.3 成就示例

1. 初学者 - 完成 10 道题
2. 勤奋学习者 - 连续学习 7 天
3. 词汇达人 - 答对 50 道词汇题
4. 语法大师 - 答对 50 道语法题
5. 全能选手 - 所有题型都练习过

## 6. 实施计划

### 阶段一：数据库升级
- 创建新表
- 迁移现有数据

### 阶段二：后端 API
- 实现用户信息 API
- 实现统计 API
- 实现设置 API
- 实现成就系统 API

### 阶段三：前端开发
- 创建个人中心页面
- 更新导航栏
- 集成所有功能

### 阶段四：测试与优化
- 功能测试
- 性能优化
- 用户体验优化
