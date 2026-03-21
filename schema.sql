-- Run: npx wrangler d1 execute ket-quiz-db --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  google_id TEXT UNIQUE,
  email TEXT,
  avatar TEXT,
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

INSERT INTO questions (type, question, options, answer, explanation) VALUES
('vocabulary', 'What is the meaning of "happy"?', '["悲伤","快乐","愤怒","害怕"]', '快乐', '"happy" 意思是快乐、高兴。'),
('vocabulary', 'Choose the correct word: She ___ to school every day.', '["go","goes","going","gone"]', 'goes', '第三人称单数用 goes。'),
('vocabulary', 'What does "beautiful" mean?', '["丑陋","普通","美丽","奇怪"]', '美丽', '"beautiful" 意思是美丽的。'),
('grammar', 'Choose the correct sentence:', '["I am go to school.","I going to school.","I am going to school.","I goes to school."]', 'I am going to school.', '现在进行时结构：be + doing。'),
('grammar', 'Fill in: There ___ two cats on the sofa.', '["is","are","am","be"]', 'are', 'two cats 是复数，用 are。'),
('grammar', '___ you like pizza?', '["Do","Does","Are","Is"]', 'Do', '一般疑问句用 Do/Does，you 用 Do。'),
('reading', 'Read: "Tom has a red bike. He rides it to school." — What color is Tom''s bike?', '["Blue","Green","Red","Yellow"]', 'Red', '文中说 "a red bike"。'),
('reading', 'Read: "Lucy loves cats. She has three cats at home." — How many cats does Lucy have?', '["One","Two","Three","Four"]', 'Three', '文中说 "three cats"。'),
('writing', 'Which sentence is written correctly?', '["my name are lucy.","My name is Lucy.","my Name Is Lucy.","MY NAME IS LUCY"]', 'My name is Lucy.', '句子首字母大写，专有名词大写，句末加句号。'),
('writing', 'Complete: "I ___ a student." (be动词)', '["am","is","are","be"]', 'am', '主语是 I，be动词用 am。'),
('listening', '[听力题] You hear: "The party starts at seven o''clock." — When does the party start?', '["6:00","7:00","8:00","9:00"]', '7:00', '听到 "seven o''clock" 即7点。'),
('listening', '[听力题] You hear: "It is sunny and warm today." — What is the weather like?', '["Rainy","Cloudy","Sunny","Snowy"]', 'Sunny', '听到 "sunny" 即晴天。'),
('speaking', 'How do you greet someone in the morning?', '["Good night","Good morning","Good evening","Goodbye"]', 'Good morning', '早上打招呼用 Good morning。'),
('speaking', 'How do you ask someone''s name politely?', '["What your name?","What is your name?","Your name what?","Name you what?"]', 'What is your name?', '正确疑问句结构：What is your name?');
