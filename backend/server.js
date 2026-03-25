const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/progress', require('./routes/progress'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;

initDb().then(() => {
  app.listen(PORT, () => console.log(`KET Quiz running on http://localhost:${PORT}`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
