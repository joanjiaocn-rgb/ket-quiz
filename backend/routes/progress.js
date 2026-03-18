const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { SECRET } = require('./auth');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未登录' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Token无效' }); }
}

router.post('/attempt', auth, (req, res) => {
  const { question_id, user_answer, is_correct, time_spent } = req.body;
  db.run('INSERT INTO attempts (user_id, question_id, user_answer, is_correct, time_spent) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, question_id, user_answer, is_correct ? 1 : 0, time_spent]);
  res.json({ ok: true });
});

router.post('/session', auth, (req, res) => {
  const { type, score, total, duration } = req.body;
  db.run('INSERT INTO sessions (user_id, type, score, total, duration) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, type, score, total, duration]);
  res.json({ ok: true });
});

router.get('/wrong', auth, (req, res) => {
  const wrongs = db.all(`
    SELECT q.id, q.type, q.question, q.options, q.answer, q.explanation,
           a.user_answer, a.attempted_at
    FROM attempts a JOIN questions q ON a.question_id = q.id
    WHERE a.user_id = ? AND a.is_correct = 0
    ORDER BY a.attempted_at DESC LIMIT 50`, [req.user.id]);
  res.json(wrongs.map(q => ({ ...q, options: q.options ? JSON.parse(q.options) : null })));
});

router.get('/stats', auth, (req, res) => {
  const types = ['vocabulary', 'grammar', 'reading', 'writing', 'listening', 'speaking'];
  const stats = {};
  for (const type of types) {
    const total = db.get('SELECT COUNT(*) as c FROM attempts a JOIN questions q ON a.question_id=q.id WHERE a.user_id=? AND q.type=?', [req.user.id, type]);
    const correct = db.get('SELECT COUNT(*) as c FROM attempts a JOIN questions q ON a.question_id=q.id WHERE a.user_id=? AND q.type=? AND a.is_correct=1', [req.user.id, type]);
    stats[type] = { total: total?.c || 0, correct: correct?.c || 0 };
  }
  const sessions = db.all('SELECT * FROM sessions WHERE user_id=? ORDER BY completed_at DESC LIMIT 10', [req.user.id]);
  res.json({ stats, sessions });
});

module.exports = router;
