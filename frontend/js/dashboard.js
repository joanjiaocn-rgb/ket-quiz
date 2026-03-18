const API = '';
const token = localStorage.getItem('token');
const username = localStorage.getItem('username');
if (!token) location.href = 'index.html';

const typeMap = {
  vocabulary: { label: '单词', icon: '📚' },
  grammar: { label: '语法', icon: '✏️' },
  reading: { label: '阅读', icon: '📖' },
  writing: { label: '写作', icon: '🖊️' },
  listening: { label: '听力', icon: '🎧' },
  speaking: { label: '口语', icon: '🗣️' }
};

document.getElementById('userName').textContent = username;
document.getElementById('welcomeUser').textContent = `👋 ${username}`;

function logout() { localStorage.clear(); location.href = 'index.html'; }
function startQuiz(type) { location.href = `quiz.html?type=${type}`; }

async function loadStats() {
  try {
    const res = await fetch(`${API}/api/progress/stats`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = '';
    for (const [type, info] of Object.entries(typeMap)) {
      const s = data.stats[type] || { total: 0, correct: 0 };
      const pct = s.total > 0 ? Math.round(s.correct / s.total * 100) : 0;
      grid.innerHTML += `
        <div class="stat-card">
          <div class="stat-icon">${info.icon}</div>
          <div class="stat-label">${info.label}</div>
          <div class="stat-nums">${s.correct}/${s.total}</div>
          <div class="stat-bar"><div class="stat-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }
    const hist = document.getElementById('sessionHistory');
    if (!data.sessions.length) {
      hist.innerHTML = '<p style="color:#9CA3AF;text-align:center;padding:20px">还没有测试记录，快去练习吧！</p>';
      return;
    }
    hist.innerHTML = data.sessions.map(s => `
      <div class="history-item">
        <span class="h-type">${typeMap[s.type]?.icon || '🌟'} ${typeMap[s.type]?.label || '综合'}</span>
        <span class="h-score">${s.score}/${s.total}</span>
        <span class="h-date">${new Date(s.completed_at).toLocaleString('zh-CN')}</span>
      </div>`).join('');
  } catch (e) { console.error(e); }
}

loadStats();
