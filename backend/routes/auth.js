const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const SECRET = 'ket_quiz_secret_2024';

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '请填写用户名和密码' });
  const existing = db.get('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) return res.status(400).json({ error: '用户名已存在' });
  const hash = bcrypt.hashSync(password, 10);
  const result = db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
  const token = jwt.sign({ id: result.lastInsertRowid, username }, SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: '用户名或密码错误' });
  const token = jwt.sign({ id: user.id, username }, SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

module.exports = router;
module.exports.SECRET = SECRET;
