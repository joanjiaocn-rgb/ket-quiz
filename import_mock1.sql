-- KET 模拟题1 导入脚本
-- Reading & Writing Part 1 (Questions 1-6) - 告示/短信理解

INSERT INTO questions (type, question, options, answer, explanation) VALUES
('reading', 'SALE! Buy a swimming costume and get 50% discount on a pair of sunglasses. What does this notice mean?',
 '["Everything in the shop is half price.","If you buy a swimming costume, you will pay half price.","You could pay less if you buy two things."]',
 'You could pay less if you buy two things.',
 '买泳衣可以享受太阳镜半价优惠，即购买两件商品可以省钱。'),

('reading', 'Hi Ellie, I''m going to an exhibition on Saturday. Do you want to come? You can buy tickets online. Let me know soon! Tina — What does this message mean?',
 '["Ellie needs to buy a ticket soon.","Ellie needs to tell Tina if she can go to the exhibition.","Tina needs to buy a ticket online for Ellie."]',
 'Ellie needs to tell Tina if she can go to the exhibition.',
 'Tina邀请Ellie去展览，让她尽快告知是否能去（Let me know soon）。'),

('reading', 'Sam, Please meet me in my office to discuss your project. I''m free at 1 p.m. and after the last lesson. Mrs Smith — What does this note mean?',
 '["Sam must talk to Mrs Smith about the lesson.","Mrs Smith is going to teach Sam at 1 p.m.","Mrs Smith wants to talk to Sam this afternoon."]',
 'Mrs Smith wants to talk to Sam this afternoon.',
 'Mrs Smith要和Sam讨论他的项目，下午1点或最后一节课后都有空。'),

('reading', 'REPAIRS: BIKES, SKATEBOARDS, SCOOTERS. Open Tuesday-Saturday. Closed Sunday-Monday. First repair: 10% discount — What does this notice mean?',
 '["New customers will pay less the first time they go to the shop.","Anyone can buy bikes for less during the week.","The shop will repair things on Mondays."]',
 'New customers will pay less the first time they go to the shop.',
 '第一次维修享受九折优惠，即新顾客首次消费可以少付钱。'),

('reading', 'Hi Tony, I''ve uploaded my festival photos. Have a look and tell me what you think! Maria — What should Tony do?',
 '["Upload his photos from the festival to Instagram.","Give Maria his opinion of the photos.","Ask Maria to send him the festival photos."]',
 'Give Maria his opinion of the photos.',
 'Maria让Tony看她上传的照片并告诉她感想（tell me what you think）。'),

('reading', 'WEBSITE-BUILDING CLUB: This week''s meeting takes place at 3.30 p.m. in the library, not the computer room. — What does this notice mean?',
 '["The place where the club meets is different this week.","The club meets in different rooms and at different times every week.","The club will not meet in the computer room anymore."]',
 'The place where the club meets is different this week.',
 '本周会议地点改为图书馆，而不是通常的电脑室，只是本周不同。'),

-- Reading & Writing Part 2 (Questions 7-13) - 三人旅行经历匹配

('reading', 'Travel experiences — Jenny: My family and I go on holiday to faraway places a lot. I spend hours in airports and on planes, and sometimes I get bored. Last winter we went to Singapore. When we arrived at the airport in Manchester, there was a terrible thunderstorm and our flight was delayed for five hours. Luckily, I had my laptop and my camera with me. I like making videos of our trips, so I kept busy and the time went quickly. — Megan: Last June, I went to the UK to study at a language school. There were people there from all over the world and I made some new friends. One Saturday, we went to a music festival. It was in a field in the countryside. It was a sunny day, so I wore my new sandals. That was a mistake. It started raining at midday and it never stopped. My feet got wet, cold and muddy. However, I enjoyed myself, and the music was brilliant. — Maria: Last summer I went on a school trip to London. On the first day we went sightseeing, but there were a lot of people everywhere because the city is so popular, so we had to queue a lot. We walked all day and my feet were tired by the end of the day. That evening I decided to stay in the hotel to rest. While I was in the hotel, my friends went on an exciting night tour of the city on a bus! — Who went on holiday with her friends?',
 '["Jenny","Megan","Maria"]',
 'Megan',
 'Megan提到"I made some new friends"并和朋友一起去了音乐节。'),

('reading', '[Same passage as Q7] Who says that it can be boring to go on long journeys?',
 '["Jenny","Megan","Maria"]',
 'Jenny',
 'Jenny说"I spend hours in airports and on planes, and sometimes I get bored."'),

('reading', '[Same passage as Q7] Who made a mistake with her shoes?',
 '["Jenny","Megan","Maria"]',
 'Megan',
 'Megan穿了新凉鞋去音乐节，结果下雨了，她说"That was a mistake."'),

('reading', '[Same passage as Q7] Who did something she enjoys while she was waiting?',
 '["Jenny","Megan","Maria"]',
 'Jenny',
 'Jenny在等待延误的航班时用笔记本电脑制作旅行视频，这是她喜欢做的事。'),

('reading', '[Same passage as Q7] Who had fun even though the weather was bad?',
 '["Jenny","Megan","Maria"]',
 'Megan',
 'Megan虽然遇到下雨，但说"I enjoyed myself, and the music was brilliant."'),

('reading', '[Same passage as Q7] Who missed an enjoyable experience with her friends?',
 '["Jenny","Megan","Maria"]',
 'Maria',
 'Maria留在酒店休息，错过了朋友们的夜间巴士游览。'),

('reading', '[Same passage as Q7] Who says she often travels?',
 '["Jenny","Megan","Maria"]',
 'Jenny',
 'Jenny说"My family and I go on holiday to faraway places a lot."'),

-- Reading & Writing Part 3 (Questions 14-18) - 文章阅读

('reading', 'The first musical instrument (by Jared Keene, age 12): Music has been an important part of people''s lives for thousands of years. Some of the oldest instruments ever found are more than 40,000 years old — they are flutes from a cave in the south of Germany. Scientists believe that thousands of years ago, people sat around fires and played the flutes for entertainment. When scientists found the first flute, they didn''t know what it was because it was broken. One scientist, Maria Malina, thought it might be an instrument, so she put the pieces together. The flute was made from the bone of a bird''s leg. — What is the text about?',
 '["Very old cave paintings.","How to make a musical instrument.","A kind of musical instrument."]',
 'A kind of musical instrument.',
 '文章主要介绍了世界上最古老的乐器——笛子。'),

('reading', '[Same passage as Q14] The flutes in the cave are special because',
 '["There aren''t many in the world.","They come from Germany.","They are very old."]',
 'They are very old.',
 '文中说这些笛子超过40,000年历史，是迄今发现的最古老的乐器之一。'),

('reading', '[Same passage as Q14] The paintings in the cave show',
 '["How people lived in the past.","How the flutes were made.","The kind of songs people sang."]',
 'How people lived in the past.',
 '文中说"They show people in their daily lives. The paintings help us learn about life in the past."'),

('reading', '[Same passage as Q14] At first, scientists didn''t know the instrument was a flute because',
 '["It was in pieces.","The pieces were from a bird''s leg.","No one had seen an ancient flute before."]',
 'It was in pieces.',
 '文中说"they didn''t know what it was because it was broken."'),

('reading', '[Same passage as Q14] Today we know',
 '["The kind of music that people played thousands of years ago.","The sound that flutes made thousands of years ago.","That people played only five notes thousands of years ago."]',
 'The sound that flutes made thousands of years ago.',
 '文中说人们可以演奏五个不同的音符，"now we know what one instrument sounded like!"'),

-- Reading & Writing Part 4 (Questions 19-24) - 完形填空 Greta Thunberg

('vocabulary', 'Greta Thunberg was born in Sweden. At 16 years old, she started a group of _____ people against climate change. (Choose the best word)',
 '["little","small","young"]',
 'young',
 '"young people"指年轻人，符合语境。little和small不用于描述人的年龄群体。'),

('vocabulary', 'Greta was _____ about the terrible things happening to our planet. She thought people weren''t doing enough to solve them. (Choose the best word)',
 '["worried","afraid","bored"]',
 'worried',
 '"worried about"表示对某事感到担忧，符合语境。afraid通常后接of，bored意思不符。'),

('vocabulary', 'So, in August 2018, Greta and a group of students had a _____ in the centre of Stockholm. (Choose the best word)',
 '["lesson","meeting","appointment"]',
 'meeting',
 '"meeting"指集会/会议，符合抗议活动的语境。lesson是课程，appointment是预约。'),

('vocabulary', 'Greta wanted journalists and people around the world to listen to the group. It was a difficult _____! (Choose the best word)',
 '["job","career","work"]',
 'job',
 '"a difficult job"表示一项艰难的任务，是固定搭配。career指职业生涯，work不与不定冠词连用。'),

('vocabulary', 'Many people around the world have become _____ in her work. (Choose the best word)',
 '["important","careful","interested"]',
 'interested',
 '"interested in"对...感兴趣，是固定搭配。'),

('vocabulary', 'Greta knows it isn''t going to be easy to change the world. But she _____ that we can all make a difference. (Choose the best word)',
 '["tells","believes","guesses"]',
 'believes',
 '"believes that"相信某事，符合语境。tells需要宾语，guesses表示猜测，语气不确定。'),

-- Reading & Writing Part 5 (Questions 25-30) - 填空

('grammar', 'Hi Cara, Thanks (0) for your email and the photos of your hometown. I enjoy reading _____ your life in Edinburgh. (Fill in one word)',
 '["about","of","from","with"]',
 'about',
 '"reading about"读到关于...的内容，是固定搭配。'),

('grammar', 'I was interested to learn that you have the same hobby _____ me. (Fill in one word)',
 '["as","like","with","than"]',
 'as',
 '"the same ... as"与...相同，是固定搭配。'),

('grammar', 'I love collecting old photos, _____ Can you send me one from Scotland? (Fill in one word)',
 '["too!","also!","either!","as well!"]',
 'too!',
 '"too"放在句末表示"也"，用于肯定句。'),

('grammar', 'Can _____ send me one from Scotland? (Fill in one word)',
 '["you","he","she","they"]',
 'you',
 '根据上下文，是在请求对方Cara寄一张照片，所以用"you"。'),

('grammar', 'I have photos of Delhi, Tokyo, Hong Kong, New York _____ London. (Fill in one word)',
 '["and","or","but","with"]',
 'and',
 '列举多个城市时用"and"连接最后两项。'),

('grammar', 'What _____ your favourite photos? (Fill in one word)',
 '["are","is","were","was"]',
 'are',
 '"photos"是复数，所以用"are"。'),

-- Listening Part 3 (Questions 11-15) - Tom和爸爸谈生日派对

('listening', '[Listening] You will hear Tom talking to his dad about his birthday party. How does Tom''s dad feel about the party at first?',
 '["He thinks it''s a great idea.","He''s unsure about the idea.","He doesn''t think there is any need for it."]',
 'He''s unsure about the idea.',
 '爸爸一开始对派对的想法不确定，持观望态度。'),

('listening', '[Listening] How many friends does Tom want to invite?',
 '["thirteen","fourteen","twenty-five"]',
 'fourteen',
 'Tom想邀请14个朋友参加生日派对。'),

('listening', '[Listening] Eva''s mother is from',
 '["the UK.","the USA.","Brazil."]',
 'Brazil.',
 'Eva的妈妈来自巴西。'),

('listening', '[Listening] Where was Eva''s party?',
 '["At a disco.","At a restaurant.","At home."]',
 'At a restaurant.',
 'Eva的派对是在餐厅举办的。'),

('listening', '[Listening] Tom''s dad says that they',
 '["don''t have to invite all the family.","have to invite the neighbours.","have to invite everyone they know."]',
 'don''t have to invite all the family.',
 'Tom的爸爸说不必邀请所有家庭成员。'),

-- Listening Part 4 (Questions 16-20) - 短对话

('listening', '[Listening] You will hear a customer talking to a shop assistant. Why does he want to return the jacket?',
 '["There is something wrong with it.","It isn''t big enough for him.","It is the wrong colour."]',
 'It isn''t big enough for him.',
 '顾客想退夹克是因为尺码不够大。'),

('listening', '[Listening] You will hear a girl talking about her best friend, Danielle. What does Danielle look like?',
 '["She has long hair and blue eyes.","She has short hair and green eyes.","She has dark hair and green eyes."]',
 'She has dark hair and green eyes.',
 'Danielle有深色头发和绿色眼睛。'),

('listening', '[Listening] You will hear a girl talking to her dentist. Why is she unhappy?',
 '["She has broken her tooth.","She has a toothache.","She has lost a lot of blood."]',
 'She has a toothache.',
 '女孩因为牙痛而不开心。'),

('listening', '[Listening] You will hear two friends talking about their plans. What do they decide to do at the weekend?',
 '["Go shopping.","Watch TV.","Go to the beach."]',
 'Go to the beach.',
 '两个朋友决定周末去海滩。'),

('listening', '[Listening] You will hear a mother talking to her son, Harry. What does Harry''s mum ask him to do?',
 '["Tidy his bedroom.","Throw the rubbish out.","Fix his skateboard."]',
 'Tidy his bedroom.',
 'Harry的妈妈让他整理卧室。');
