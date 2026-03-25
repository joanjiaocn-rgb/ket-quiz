const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { SECRET } = require('./auth');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token无效' });
  }
}

// GET /api/user/profile - 获取用户信息
router.get('/profile', auth, (req, res) => {
  const user = db.get('SELECT id, username, display_name, bio, level, total_points, avatar FROM users WHERE id = ?', [req.user.id]);
  const profile = db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
  const settings = db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);

  res.json({ user: user || {}, profile: profile || {}, settings: settings || {} });
});

// PUT /api/user/profile - 更新用户信息
router.put('/profile', auth, (req, res) => {
  const { display_name, bio, study_goal, target_score } = req.body;

  // 更新 users 表
  db.run('UPDATE users SET display_name = ?, bio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [display_name, bio, req.user.id]);

  // 更新或创建 user_profiles 记录
  const existing = db.get('SELECT id FROM user_profiles WHERE user_id = ?', [req.user.id]);
  if (existing) {
    db.run(`UPDATE user_profiles SET
      study_goal = COALESCE(?, study_goal),
      target_score = COALESCE(?, target_score),
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
      [study_goal, target_score ? parseInt(target_score) : null, req.user.id]);
  } else {
    db.run(`INSERT INTO user_profiles (user_id, study_goal, target_score)
      VALUES (?, ?, ?)`,
      [req.user.id, study_goal, target_score ? parseInt(target_score) : null]);
  }

  res.json({ success: true });
});

// GET /api/user/statistics - 获取用户学习统计
router.get('/statistics', auth, (req, res) => {
  // 从 attempts 表获取统计数据
  const totalResult = db.get(
    'SELECT COUNT(*) as total FROM attempts WHERE user_id = ?',
    [req.user.id]
  );
  const correctResult = db.get(
    'SELECT COUNT(*) as correct FROM attempts WHERE user_id = ? AND is_correct = 1',
    [req.user.id]
  );

  const totalAnswered = totalResult?.total || 0;
  const correctAnswers = correctResult?.correct || 0;
  const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

  // 从 sessions 表获取会话数
  const sessionsResult = db.get(
    'SELECT COUNT(*) as total FROM sessions WHERE user_id = ?',
    [req.user.id]
  );
  const totalSessions = sessionsResult?.total || 0;

  // 计算连续学习天数
  const lastStudyDate = db.get(
    "SELECT DATE(attempted_at) as date FROM attempts WHERE user_id = ? ORDER BY attempted_at DESC LIMIT 1",
    [req.user.id]
  );

  let streakDays = 0;
  if (lastStudyDate?.date) {
    const today = new Date();
    const lastDate = new Date(lastStudyDate.date);
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      // 如果是今天或昨天，计算连续天数
      streakDays = 1;
      let checkDate = new Date(lastDate);

      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasData = db.get(
          `SELECT COUNT(*) as c FROM attempts
           WHERE user_id = ? AND DATE(attempted_at) = ?`,
          [req.user.id, dateStr]
        );

        if (hasData?.c > 0) {
          streakDays++;
        } else {
          break;
        }
      }
    }
  }

  // 计算总学习时间（秒）
  const studyTimeResult = db.get(
    'SELECT SUM(time_spent) as total_time FROM attempts WHERE user_id = ?',
    [req.user.id]
  );
  const totalStudyTime = studyTimeResult?.total_time || 0;

  res.json({
    total_questions_answered: totalAnswered,
    correct_answers: correctAnswers,
    accuracy: accuracy,
    total_sessions: totalSessions,
    streak_days: streakDays,
    total_study_time: totalStudyTime,
    last_study_date: lastStudyDate?.date || null
  });
});

// GET /api/user/achievements - 获取成就列表
router.get('/achievements', auth, (req, res) => {
  // 获取所有成就定义
  const allAchievements = db.all('SELECT * FROM achievements');
  if (!allAchievements.length) {
    // 如果成就表为空，返回空数组
    res.json({ all: [] });
    return;
  }

  // 获取用户已解锁的成就
  const userAchievements = db.all(
    'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
    [req.user.id]
  );
  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

  // 组合数据
  const result = allAchievements.map(a => ({
    ...a,
    unlocked: unlockedIds.has(a.id)
  }));

  res.json({ all: result });
});

// GET /api/user/settings - 获取用户设置
router.get('/settings', auth, (req, res) => {
  const settings = db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
  res.json(settings || {
    notifications_enabled: 1,
    sound_enabled: 1,
    auto_play_audio: 0,
    theme: 'light',
    language: 'zh-CN'
  });
});

// PUT /api/user/settings - 更新用户设置
router.put('/settings', auth, (req, res) => {
  const { notifications_enabled, sound_enabled, auto_play_audio, theme, language } = req.body;

  const existing = db.get('SELECT id FROM user_settings WHERE user_id = ?', [req.user.id]);
  if (existing) {
    db.run(`UPDATE user_settings SET
      notifications_enabled = COALESCE(?, notifications_enabled),
      sound_enabled = COALESCE(?, sound_enabled),
      auto_play_audio = COALESCE(?, auto_play_audio),
      theme = COALESCE(?, theme),
      language = COALESCE(?, language),
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
      [notifications_enabled, sound_enabled, auto_play_audio, theme, language, req.user.id]);
  } else {
    db.run(`INSERT INTO user_settings (user_id, notifications_enabled, sound_enabled, auto_play_audio, theme, language)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, notifications_enabled, sound_enabled, auto_play_audio, theme, language]);
  }

  res.json({ success: true });
});

module.exports = router;
