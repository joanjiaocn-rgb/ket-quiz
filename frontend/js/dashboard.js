const API = '';
const token = localStorage.getItem('token');
const username = localStorage.getItem('username');
if (!token) location.href = 'index.html';

const typeMap = {
  vocabulary: { label: 'Vocabulary', icon: '📚' },
  grammar: { label: 'Grammar', icon: '✏️' },
  reading: { label: 'Reading', icon: '📖' },
  writing: { label: 'Writing', icon: '🖊️' },
  listening: { label: 'Listening', icon: '🎧' },
  speaking: { label: 'Speaking', icon: '🗣️' }
};

document.getElementById('userName').textContent = username;
document.getElementById('welcomeUser').textContent = `👋 ${username || 'Student'}`;

function logout() { localStorage.clear(); location.href = 'index.html'; }

async function checkSubscription() {
  try {
    const res = await fetch(`${API}/api/user/subscription`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    // Convert isPro to boolean
    const isPro = !!data.isPro;

    // Show upgrade button for all users with different text
    const proBtn = document.getElementById('proBtn');
    proBtn.style.display = 'inline-block';
    
    if (isPro) {
      // Pro users: show "Upgrade Plan", unlock all topics, hide banner
      proBtn.textContent = '⭐ Upgrade Plan';
      document.getElementById('proBanner').style.display = 'none';
      document.getElementById('dailyQuota').style.display = 'none';
      document.querySelectorAll('.type-card.locked').forEach(card => {
        card.classList.remove('locked');
        const lockDiv = card.querySelector('.pro-lock');
        if (lockDiv) lockDiv.remove();
        const type = card.id.replace('Card', '');
        card.onclick = () => startQuiz(type);
      });
    } else {
      // Free users: show "Upgrade", lock premium topics
      proBtn.textContent = '🚀 Upgrade';
      document.getElementById('proBanner').style.display = 'block';
      document.getElementById('dailyQuota').style.display = 'block';
      document.getElementById('todayCount').textContent = data.todayQuestions || 0;

      // Disable free topics if reached 20 questions
      if (data.todayQuestions >= 20) {
        document.querySelectorAll('.type-card:not(.locked)').forEach(card => {
          card.style.opacity = '0.5';
          card.style.pointerEvents = 'none';
        });
      }
    }
  } catch (e) {
    console.error('Subscription check failed:', e);
    // Default to free user on API failure
    document.getElementById('proBtn').style.display = 'inline-block';
    document.getElementById('proBtn').textContent = '🚀 Upgrade';
    document.getElementById('proBanner').style.display = 'block';
    document.getElementById('dailyQuota').style.display = 'block';
    document.getElementById('todayCount').textContent = '0';
  }
}

function checkPro(type) {
  alert(`🔒 ${typeMap[type]?.label || type} is a Pro feature\n\nUpgrade to Pro to unlock all topics and unlimited practice!`);
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
      hist.innerHTML = '<p style="color:#9CA3AF;text-align:center;padding:20px">No practice sessions yet. Start practicing now!</p>';
      return;
    }
    hist.innerHTML = data.sessions.map(s => `
      <div class="history-item">
        <span class="h-type">${typeMap[s.type]?.icon || '🌟'} ${typeMap[s.type]?.label || 'Mixed'}</span>
        <span class="h-score">${s.score}/${s.total}</span>
        <span class="h-date">${new Date(s.completed_at).toLocaleString('en-US')}</span>
      </div>`).join('');
  } catch (e) { console.error(e); }
}

// Initialize
async function init() {
  // Check if banner was closed
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