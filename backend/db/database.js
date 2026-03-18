const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'ket.db');
let db;

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT,
      answer TEXT NOT NULL,
      explanation TEXT,
      audio_url TEXT
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      user_answer TEXT,
      is_correct INTEGER,
      time_spent INTEGER,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      score INTEGER,
      total INTEGER,
      duration INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const res = db.exec('SELECT COUNT(*) as c FROM questions');
  const count = res[0]?.values[0][0] || 0;
  if (count === 0) {
    const questions = [
      ['vocabulary', 'What is the meaning of "happy"?', JSON.stringify(['悲伤','快乐','愤怒','害怕']), '快乐', '"happy" 意思是快乐、高兴。'],
      ['vocabulary', 'Choose the correct word: She ___ to school every day.', JSON.stringify(['go','goes','going','gone']), 'goes', '第三人称单数用 goes。'],
      ['vocabulary', 'What does "beautiful" mean?', JSON.stringify(['丑陋','普通','美丽','奇怪']), '美丽', '"beautiful" 意思是美丽的。'],
      ['grammar', 'Choose the correct sentence:', JSON.stringify(['I am go to school.','I going to school.','I am going to school.','I goes to school.']), 'I am going to school.', '现在进行时结构：be + doing。'],
      ['grammar', 'Fill in: There ___ two cats on the sofa.', JSON.stringify(['is','are','am','be']), 'are', 'two cats 是复数，用 are。'],
      ['grammar', '___ you like pizza?', JSON.stringify(['Do','Does','Are','Is']), 'Do', '一般疑问句用 Do/Does，you 用 Do。'],
      ['reading', 'Read: "Tom has a red bike. He rides it to school." — What color is Tom\'s bike?', JSON.stringify(['Blue','Green','Red','Yellow']), 'Red', '文中说 "a red bike"。'],
      ['reading', 'Read: "Lucy loves cats. She has three cats at home." — How many cats does Lucy have?', JSON.stringify(['One','Two','Three','Four']), 'Three', '文中说 "three cats"。'],
      ['writing', 'Which sentence is written correctly?', JSON.stringify(['my name are lucy.','My name is Lucy.','my Name Is Lucy.','MY NAME IS LUCY']), 'My name is Lucy.', '句子首字母大写，专有名词大写，句末加句号。'],
      ['writing', 'Complete: "I ___ a student." (be动词)', JSON.stringify(['am','is','are','be']), 'am', '主语是 I，be动词用 am。'],
      ['listening', '[听力题] You hear: "The party starts at seven o\'clock." — When does the party start?', JSON.stringify(['6:00','7:00','8:00','9:00']), '7:00', '听到 "seven o\'clock" 即7点。'],
      ['listening', '[听力题] You hear: "It is sunny and warm today." — What is the weather like?', JSON.stringify(['Rainy','Cloudy','Sunny','Snowy']), 'Sunny', '听到 "sunny" 即晴天。'],
      ['speaking', 'How do you greet someone in the morning?', JSON.stringify(['Good night','Good morning','Good evening','Goodbye']), 'Good morning', '早上打招呼用 Good morning。'],
      ['speaking', 'How do you ask someone\'s name politely?', JSON.stringify(['What your name?','What is your name?','Your name what?','Name you what?']), 'What is your name?', '正确疑问句结构：What is your name?'],
    ];
    for (const q of questions) {
      db.run('INSERT INTO questions (type, question, options, answer, explanation) VALUES (?,?,?,?,?)', q);
    }
    save();
    console.log('Sample questions seeded.');
  }
}

function save() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function all(sql, params = []) {
  const p = [...params];
  const res = db.exec(sql.replace(/\?/g, () => {
    const v = p.shift();
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return v;
    return `'${String(v).replace(/'/g, "''")}'`;
  }));
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

function get(sql, params = []) { return all(sql, params)[0] || null; }

function run(sql, params = []) {
  const p = [...params];
  db.run(sql.replace(/\?/g, () => {
    const v = p.shift();
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return v;
    return `'${String(v).replace(/'/g, "''")}'`;
  }));
  save();
  return { lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] };
}

module.exports = { initDb, all, get, run };
