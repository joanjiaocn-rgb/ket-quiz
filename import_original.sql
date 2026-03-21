-- KET 原创测试题（参照模拟1风格和难度）
-- Part 1 风格：告示/短信/便条理解（reading）

INSERT INTO questions (type, question, options, answer, explanation) VALUES

-- === READING: 告示/短信理解 ===
('reading',
 'SPORTS CENTRE: Buy one month membership and get the second month FREE. New members only. What does this notice mean?',
 '["All members can get two months for the price of one.","New members can get an extra free month when they join.","You must buy two months of membership at the same time."]',
 'New members can get an extra free month when they join.',
 '告示说"New members only"，所以只有新会员才能享受买一送一的优惠。'),

('reading',
 'Hi Sam, I left my science textbook at your house yesterday. Could you bring it to school tomorrow? Thanks! — Leo. What does Leo want Sam to do?',
 '["Lend Sam his science textbook.","Return Leo''s book to him at school.","Go to Leo''s house to get the book."]',
 'Return Leo''s book to him at school.',
 'Leo把书落在Sam家，请Sam明天带到学校还给他。'),

('reading',
 'CAFÉ NOTICE: We are closed for repairs on Monday 14th. We will reopen on Tuesday as usual. What does this notice tell customers?',
 '["The café is closing permanently.","The café will be shut for one day.","The café opens on Mondays only."]',
 'The café will be shut for one day.',
 '告示说周一关门维修，周二照常重新开放，所以只关闭一天。'),

('reading',
 'Anna, Your piano lesson has been moved to 4:30 p.m. on Thursday instead of Wednesday. Please let me know if this is OK. — Mrs Clarke. What is Mrs Clarke telling Anna?',
 '["Anna''s lesson time has changed.","Anna needs to practise more piano.","Mrs Clarke cannot teach Anna anymore."]',
 'Anna''s lesson time has changed.',
 'Mrs Clarke通知Anna钢琴课从周三改到了周四4:30。'),

('reading',
 'LIBRARY: Books can be borrowed for THREE weeks. After that, you will be charged 20p per day. What does this notice mean?',
 '["You must return books within three weeks or pay a fee.","Books cost 20p to borrow for three weeks.","You can only borrow books for one day."]',
 'You must return books within three weeks or pay a fee.',
 '图书馆规定借书期限三周，超期每天收取20便士罚款。'),

('reading',
 'Hi Jade, I''m having a birthday party on Saturday at 6 p.m. Can you come? Bring something to eat if you can! — Ruby. What does Ruby want Jade to do?',
 '["Cook dinner for Ruby on Saturday.","Come to a party and possibly bring food.","Buy Ruby a birthday present."]',
 'Come to a party and possibly bring food.',
 'Ruby邀请Jade参加派对，并说"if you can"带些吃的，不是强制要求。'),

-- === READING: 三人经历匹配 ===
('reading',
 'Three students talk about learning English. — Jack: I started learning English when I was five. My parents sent me to an English school every weekend. I found it difficult at first, but now I love it. I watch English films every day to improve my listening. — Sophie: I only started learning English two years ago at secondary school. My teacher is really fun and makes the lessons interesting. I enjoy reading English books in my free time, especially adventure stories. — Carlos: I moved to England from Spain three years ago. I had to learn English very quickly because I needed it for school. It was hard, but my classmates helped me a lot. Now I help other new students who are learning English. — Who started learning English at a young age?',
 '["Jack","Sophie","Carlos"]',
 'Jack',
 'Jack说他5岁就开始学英语（"when I was five"）。'),

('reading',
 '[Same passage] Who enjoys reading in English?',
 '["Jack","Sophie","Carlos"]',
 'Sophie',
 'Sophie说她喜欢在空闲时间读英文书（"I enjoy reading English books in my free time"）。'),

('reading',
 '[Same passage] Who learned English because they needed it for school?',
 '["Jack","Sophie","Carlos"]',
 'Carlos',
 'Carlos搬到英国后必须快速学英语，因为学校需要用到（"I needed it for school"）。'),

('reading',
 '[Same passage] Who helps other people learn English now?',
 '["Jack","Sophie","Carlos"]',
 'Carlos',
 'Carlos现在帮助其他正在学英语的新同学（"I help other new students"）。'),

('reading',
 '[Same passage] Who uses films to practise English?',
 '["Jack","Sophie","Carlos"]',
 'Jack',
 'Jack每天看英文电影来提高听力（"I watch English films every day"）。'),

-- === READING: 文章阅读理解 ===
('reading',
 'The Honey Bee — Honey bees are some of the most important insects in the world. They live in large groups called colonies, which can have up to 60,000 bees. Each colony has one queen bee, whose job is to lay eggs. Worker bees collect nectar from flowers and bring it back to the hive, where they turn it into honey. Bees are very important for plants because they carry pollen from one flower to another. Without bees, many plants could not grow. Scientists are worried because the number of bees in the world is getting smaller. This is because of chemicals used on farms and the loss of wild flowers. Many people are now planting flowers in their gardens to help bees. — What is the main topic of this text?',
 '["How to make honey at home.","Why honey bees are important and in danger.","The different types of insects in the world."]',
 'Why honey bees are important and in danger.',
 '文章介绍了蜜蜂的重要性以及它们数量减少的原因。'),

('reading',
 '[Same passage about honey bees] How many bees can live in one colony?',
 '["Up to 6,000.","Up to 60,000.","Up to 600,000."]',
 'Up to 60,000.',
 '文中说"can have up to 60,000 bees"。'),

('reading',
 '[Same passage about honey bees] Why are bees important for plants?',
 '["They water the plants.","They carry pollen between flowers.","They protect flowers from insects."]',
 'They carry pollen between flowers.',
 '文中说"they carry pollen from one flower to another"，这对植物生长至关重要。'),

('reading',
 '[Same passage about honey bees] What is one reason why the number of bees is falling?',
 '["Bees are being eaten by other insects.","Chemicals used on farms are harming bees.","People are taking too much honey from hives."]',
 'Chemicals used on farms are harming bees.',
 '文中提到"chemicals used on farms"是蜜蜂数量减少的原因之一。'),

-- === VOCABULARY: 完形填空风格 ===
('vocabulary',
 'Maria is very _____ about her new job. She talks about it all the time!',
 '["excited","exciting","excite","excitement"]',
 'excited',
 '"excited"是形容词，描述人的感受（感到兴奋）。"exciting"描述事物令人兴奋。'),

('vocabulary',
 'Could you _____ me the way to the nearest bus stop, please?',
 '["say","tell","speak","talk"]',
 'tell',
 '"tell someone the way"告诉某人路怎么走，是固定搭配。'),

('vocabulary',
 'I need to _____ some money from the bank before we go shopping.',
 '["take out","take off","take up","take in"]',
 'take out',
 '"take out money"或"withdraw money"从银行取钱，是固定搭配。'),

('vocabulary',
 'The film was so _____ that I fell asleep in the cinema.',
 '["bored","boring","bore","boredom"]',
 'boring',
 '"boring"描述事物令人感到无聊。"bored"描述人感到无聊。'),

('vocabulary',
 'She _____ her glasses and couldn''t read the menu.',
 '["forgot","left","lost","missed"]',
 'left',
 '"left"表示把东西遗忘在某处（leave something somewhere）。"lost"表示找不到了，语境不同。'),

('vocabulary',
 'The weather _____ be cold tomorrow, so bring a jacket.',
 '["might","must","should","will"]',
 'might',
 '"might"表示可能性，天气预报不确定，用might最合适。'),

('vocabulary',
 'My brother is very good _____ playing the guitar.',
 '["in","on","at","for"]',
 'at',
 '"good at"擅长某事，是固定搭配。'),

('vocabulary',
 'We had to _____ for over an hour before we got into the museum.',
 '["wait","queue","stand","sit"]',
 'queue',
 '"queue"特指排队等候，符合进博物馆前排队的语境。'),

-- === GRAMMAR: 语法选择 ===
('grammar',
 'She _____ her homework when her phone rang.',
 '["did","was doing","has done","does"]',
 'was doing',
 '过去进行时（was doing）表示过去某一时刻正在进行的动作，被另一个动作（rang）打断。'),

('grammar',
 'This is the best pizza I _____ ever eaten.',
 '["have","had","has","am"]',
 'have',
 '现在完成时结构：have/has + 过去分词。主语是I，用have。'),

('grammar',
 'There _____ any milk left in the fridge. We need to buy some.',
 '["isn''t","aren''t","wasn''t","weren''t"]',
 'isn''t',
 '"milk"是不可数名词，用单数动词。"isn''t any"表示没有。'),

('grammar',
 'If it _____ tomorrow, we will cancel the picnic.',
 '["rains","will rain","rained","is raining"]',
 'rains',
 '第一条件句：If + 一般现在时，主句用will + 动词原形。'),

('grammar',
 'The book _____ by millions of people around the world.',
 '["reads","is read","read","has read"]',
 'is read',
 '被动语态：be + 过去分词。书被人们阅读，用被动语态。'),

('grammar',
 'I''ve lived in this city _____ I was born.',
 '["for","since","during","while"]',
 'since',
 '"since"后接时间点（since I was born），"for"后接时间段。'),

('grammar',
 'You _____ eat so much sugar — it''s bad for your teeth.',
 '["mustn''t","don''t have to","couldn''t","wouldn''t"]',
 'mustn''t',
 '"mustn''t"表示禁止/不应该做某事。"don''t have to"表示不必须，语义不同。'),

('grammar',
 'By the time we arrived, the concert _____ already started.',
 '["has","had","was","is"]',
 'had',
 '过去完成时（had + 过去分词）表示在过去某时间点之前已经发生的事。'),

-- === LISTENING 风格题 ===
('listening',
 '[Listening] You hear a boy talking to his mum. Boy: "Mum, can I go to Jake''s house after school?" Mum: "Have you finished your homework?" Boy: "Almost. I just need to do the maths." Mum: "Finish it first, then you can go." — What must the boy do before going to Jake''s house?',
 '["Clean his room.","Finish his maths homework.","Have dinner."]',
 'Finish his maths homework.',
 '妈妈说先完成作业才能去，男孩说还剩数学没做完。'),

('listening',
 '[Listening] You hear two friends talking. Girl: "Are you coming to Emma''s party on Friday?" Boy: "I''d love to, but I have football practice until 7." Girl: "The party starts at 8, so you''ll be fine!" Boy: "Great, I''ll be there then." — Why was the boy worried about going to the party?',
 '["He didn''t have a present for Emma.","He had football practice that evening.","He didn''t know where Emma lived."]',
 'He had football practice that evening.',
 '男孩说他有足球训练到7点，担心来不及参加派对。'),

('listening',
 '[Listening] You hear a weather forecast. "Tomorrow will start cloudy in the morning, but the sun will come out in the afternoon. Temperatures will reach 18 degrees. There is a small chance of rain in the evening." — What will the weather be like in the afternoon?',
 '["Cloudy and cold.","Sunny and warm.","Rainy and windy."]',
 'Sunny and warm.',
 '天气预报说下午会出太阳，气温达到18度，所以是晴天暖和。'),

('listening',
 '[Listening] You hear a girl leaving a voicemail. "Hi, this is Lily. I''m calling about the guitar lessons. I saw your advert online. I''m 14 years old and I''ve never played before. Could you call me back on 07823 441 556? Thanks." — Why is Lily calling?',
 '["To cancel a guitar lesson.","To ask about starting guitar lessons.","To complain about a guitar teacher."]',
 'To ask about starting guitar lessons.',
 'Lily看到吉他课广告，想了解更多信息，她从未弹过吉他。'),

('listening',
 '[Listening] You hear a teacher talking to students. "Don''t forget — your history projects are due next Friday, not this Friday. You have one extra week. Make sure you include at least three sources in your bibliography." — When are the history projects due?',
 '["This Friday.","Next Friday.","In three weeks."]',
 'Next Friday.',
 '老师说是下周五交，不是本周五，多给了一周时间。'),

-- === WRITING 风格题（选择正确句子）===
('writing',
 'Which sentence is grammatically correct?',
 '["Yesterday I go to the market with my sister.","Yesterday I went to the market with my sister.","Yesterday I was go to the market with my sister.","Yesterday I going to the market with my sister."]',
 'Yesterday I went to the market with my sister.',
 '"Yesterday"表示过去，动词用过去式"went"。'),

('writing',
 'Which sentence uses punctuation correctly?',
 '["my favourite subjects are maths english and science","My favourite subjects are maths, english, and science.","My favourite subjects are Maths, English, and Science.","my favourite subjects are Maths English and Science."]',
 'My favourite subjects are Maths, English, and Science.',
 '句子首字母大写，科目名称大写，列举时用逗号分隔，句末加句号。'),

('writing',
 'You want to write an email to your friend about a film you saw. Which opening sentence is best?',
 '["I am writing to inform you of a cinematic experience I recently attended.","Hi! I saw an amazing film last night and I have to tell you about it!","Dear Sir/Madam, I would like to discuss a film.","To whom it may concern, I watched a film."]',
 'Hi! I saw an amazing film last night and I have to tell you about it!',
 'KET写作要求语言自然、友好，适合给朋友写非正式邮件的开头。'),

('writing',
 'Which sentence correctly describes the picture of a girl reading in a park?',
 '["The girl reads a book in the park yesterday.","A girl is sitting in the park and reading a book.","Girl in park she reading book.","The girl was read a book in the park."]',
 'A girl is sitting in the park and reading a book.',
 '描述图片用现在进行时，句子结构完整正确。');
