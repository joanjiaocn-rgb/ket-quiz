const API = '';
const token = localStorage.getItem('token');
if (!token) location.href = 'index.html';

const params = new URLSearchParams(location.search);
const quizType = params.get('type') || 'all';
const typeMap = {
  vocabulary: '单词', grammar: '语法', reading: '阅读',
  writing: '写作', listening: '听力', speaking: '口语', all: '综合测试'
};

document.getElementById('quizTypeLabel').textContent = typeMap[quizType] || quizType;

let questions = [], current = 0, score = 0, startTime = Date.now(), questionStart = 0;
let timerInterval;

function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${m}:${s}`;
  }, 1000);
}

function updateProgress() {
  const pct = questions.length ? (current / questions.length * 100) : 0;
  document.getElementById('progressBar').innerHTML = `<div style="width:${pct}%"></div>`;
  document.getElementById('progressText').textContent = `${current} / ${questions.length}`;
}

function renderQuestion() {
  if (current >= questions.length) { showResult(); return; }
  const q = questions[current];
  questionStart = Date.now();
  updateProgress();
  const optLabels = ['A', 'B', 'C', 'D'];
  const optionsHtml = q.options ? q.options.map((opt, i) => `
    <button class="option-btn" data-index="${i}" onclick="selectAnswer(this, ${i}, ${q.id})">
      <span class="opt-label">${optLabels[i]}</span>
      <span>${opt}</span>
    </button>`).join('') : '<p style="color:#9CA3AF">此题型暂无选项</p>';

  document.getElementById('quizArea').innerHTML = `
    <div class="question-num">第 ${current + 1} 题 / 共 ${questions.length} 题</div>
    <div class="question-type-badge">${typeMap[q.type] || q.type}</div>
    <div class="question-text">${q.question}</div>
    <div class="options-grid">${optionsHtml}</div>
    <div id="expBox"></div>
    <div class="next-btn-wrap" id="nextWrap" style="display:none">
      <button class="btn-primary" onclick="nextQuestion()">
        ${current + 1 >= questions.length ? '查看结果 🎉' : '下一题 →'}
      </button>
    </div>`;
}

function selectAnswer(btn, selectedIndex, qId) {
  const q = questions[current];
  const selected = q.options[selectedIndex];
  const timeSpent = Math.floor((Date.now() - questionStart) / 1000);
  const isCorrect = selected === q.answer;
  if (isCorrect) { score++; document.getElementById('currentScore').textContent = score; }

  document.querySelectorAll('.option-btn').forEach(b => {
    b.disabled = true;
    const optText = b.querySelector('span:last-child').textContent;
    if (optText === q.answer) b.classList.add('correct');
    else if (b === btn && !isCorrect) b.classList.add('wrong');
  });

  document.getElementById('expBox').innerHTML = `
    <div class="explanation-box">
      <strong>${isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}</strong>
      正确答案：${q.answer}${q.explanation ? '<br>' + q.explanation : ''}
    </div>`;
  document.getElementById('nextWrap').style.display = 'block';

  if (token) {
    fetch(`${API}/api/progress/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question_id: qId, user_answer: selected, is_correct: isCorrect, time_spent: timeSpent })
    }).catch(() => {});
  }
}

function nextQuestion() { current++; renderQuestion(); }

function showResult() {
  clearInterval(timerInterval);
  const duration = Math.floor((Date.now() - startTime) / 1000);
  const pct = Math.round(score / questions.length * 100);
  let emoji = '😢', msg = '继续加油，多练习！';
  if (pct >= 90) { emoji = '🏆'; msg = '太厉害了！满分选手！'; }
  else if (pct >= 70) { emoji = '🎉'; msg = '很不错！再接再厉！'; }
  else if (pct >= 50) { emoji = '💪'; msg = '还不错，继续努力！'; }

  document.getElementById('quizArea').classList.add('hidden');
  document.getElementById('resultArea').classList.remove('hidden');
  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalTotal').textContent = questions.length;
  document.getElementById('resultMsg').textContent = msg;

  if (token) {
    fetch(`${API}/api/progress/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: quizType, score, total: questions.length, duration })
    }).catch(() => {});
  }
}

function confirmExit() {
  if (current === 0 || confirm('确定要退出答题吗？')) location.href = 'dashboard.html';
}

async function loadQuestions() {
  try {
    const res = await fetch(`${API}/api/questions/${quizType}?limit=10`);
    questions = await res.json();
    if (!questions.length) {
      document.getElementById('quizArea').innerHTML = '<p style="text-align:center;padding:40px;color:#9CA3AF">暂无题目，请稍后再试</p>';
      return;
    }
    startTimer();
    renderQuestion();
  } catch {
    document.getElementById('quizArea').innerHTML = '<p style="text-align:center;padding:40px;color:#F87171">加载失败，请刷新重试</p>';
  }
}

loadQuestions();
