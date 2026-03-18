const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/:type', (req, res) => {
  const { type } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  let questions;
  if (type === 'all') {
    questions = db.all('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?', [limit]);
  } else {
    questions = db.all('SELECT * FROM questions WHERE type = ? ORDER BY RANDOM() LIMIT ?', [type, limit]);
  }
  questions = questions.map(q => ({ ...q, options: q.options ? JSON.parse(q.options) : null }));
  res.json(questions);
});

module.exports = router;
