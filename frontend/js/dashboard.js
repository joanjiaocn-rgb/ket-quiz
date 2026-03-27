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

async function checkSubscription() {
  try {
    const res = await fetch(`${API}/api/user/subscription`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    // 使用 !! 将 isPro 转换为布尔值，null/undefined 会被视为 false
    const isPro = !!data.isPro;

    if (isPro) {
      // Pro 用户：隐藏升级按钮，解锁所有题型
      document.getElementById('proBtn').style.display = 'none';
      document.getElementById('proBanner').style.display = 'none';
      document.getElementById('dailyQuota').style.display = 'none';
      document.querySelectorAll('.type-card.locked').forEach(card => {
        card.classList.remove('locked');
        const lockDiv = card.querySelector('.pro-lock');
        if (lockDiv) lockDiv.remove();
        // 恢复点击事件
        const type = card.id.replace('Card', '');
        card.onclick = () => startQuiz(type);
      });
    } else {
      // 免费用户：显示升级按钮，锁定付费题型
      document.getElementById('proBtn').style.display = 'inline-block';
      document.getElementById('proBanner').style.display = 'block';
      document.getElementById('dailyQuota').style.display = 'block';
      document.getElementById('todayCount').textContent = data.todayQuestions || 0;

      // 如果今日已达20题，禁用单词和语法
      if (data.todayQuestions >= 20) {
        document.querySelectorAll('.type-card:not(.locked)').forEach(card => {
          card.style.opacity = '0.5';
          card.style.pointerEvents = 'none';
        });
      }
    }
  } catch (e) {
    console.error('检查订阅失败:', e);
    // API 失败时，默认显示升级引导（假设是免费用户）
    document.getElementById('proBtn').style.display = 'inline-block';
    document.getElementById('proBanner').style.display = 'block';
    document.getElementById('dailyQuota').style.display = 'block';
    document.getElementById('todayCount').textContent = '0';
  }
}

function checkPro(type) {
  alert(`🔒 ${typeMap[type]?.label || type} 是 Pro 专属功能\n\n升级 Pro 解锁所有题型和无限练习！`);
  location.href = 'pricing.html';
}

function closeProBanner() {
  document.getElementById('proBanner').style.display = 'none';
  localStorage.setItem('proBannerClosed', Date.now());
}

function startQuiz(type) {
  location.href = `quiz.html?type=${type}`;
}

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

// 初始化
async function init() {
  // 检查 Pro 横幅是否已关闭
  const bannerClosed = localStorage.getItem('proBannerClosed');
  if (bannerClosed && Date.now() - parseInt(bannerClosed) < 24 * 60 * 60 * 1000) {
    document.getElementById('proBanner').style.display = 'none';
  }

  await Promise.all([
    checkSubscription(),
    loadStats()
  ]);
}

init();
