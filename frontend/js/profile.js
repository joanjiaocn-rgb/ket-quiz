const API_BASE = location.origin + '/api';
let token = localStorage.getItem('token');
let currentUser = null;

if (!token) location.href = 'index.html';

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  location.href = 'index.html';
}

function switchTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.nav-tab[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    currentUser = data;
    renderProfile(data);
  } catch (e) {
    console.error('加载个人资料失败:', e);
  }
}

function renderProfile(data) {
  const { user, profile, settings } = data;

  // 头部信息
  if (user.avatar) {
    document.getElementById('profileAvatar').innerHTML = `<img src="${user.avatar}" alt="avatar">`;
  }
  document.getElementById('profileName').textContent = user.display_name || user.username;
  document.getElementById('profileBio').textContent = user.bio || '';
  document.getElementById('profileLevel').textContent = user.level || 1;
  document.getElementById('profilePoints').textContent = user.total_points || 0;
  document.getElementById('welcomeUser').textContent = `👤 ${user.username}`;

  // 表单
  if (user.display_name) document.getElementById('displayName').value = user.display_name;
  if (user.bio) document.getElementById('bio').value = user.bio;
  if (profile?.study_goal) document.getElementById('studyGoal').value = profile.study_goal;
  if (profile?.target_score) document.getElementById('targetScore').value = profile.target_score;

  // 设置
  if (settings) {
    document.getElementById('notificationsEnabled').checked = !!settings.notifications_enabled;
    document.getElementById('soundEnabled').checked = !!settings.sound_enabled;
    document.getElementById('autoPlayAudio').checked = !!settings.auto_play_audio;
    if (settings.theme) document.getElementById('theme').value = settings.theme;
    if (settings.language) document.getElementById('language').value = settings.language;
  }
}

async function loadStatistics() {
  try {
    const res = await fetch(`${API_BASE}/user/statistics`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const stats = await res.json();
    if (stats.error) throw new Error(stats.error);
    renderStatistics(stats);
  } catch (e) {
    console.error('加载统计数据失败:', e);
  }
}

function renderStatistics(stats) {
  document.getElementById('statsCards').innerHTML = `
    <div class="stat-card">
      <div class="number">${stats.total_questions_answered || 0}</div>
      <div class="label">总答题数</div>
    </div>
    <div class="stat-card">
      <div class="number">${stats.accuracy || 0}%</div>
      <div class="label">正确率</div>
    </div>
    <div class="stat-card">
      <div class="number">${stats.total_sessions || 0}</div>
      <div class="label">练习场次</div>
    </div>
    <div class="stat-card">
      <div class="number">${stats.streak_days || 0}天</div>
      <div class="label">连续学习</div>
    </div>
  `;
}

async function loadAchievements() {
  try {
    const res = await fetch(`${API_BASE}/user/achievements`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderAchievements(data.all);
  } catch (e) {
    console.error('加载成就失败:', e);
  }
}

function renderAchievements(achievements) {
  const html = achievements.map(a => `
    <div class="achievement-item ${a.unlocked ? '' : 'locked'}">
      <div class="achievement-icon">${a.icon || '🏅'}</div>
      <div class="achievement-info">
        <h4>${a.name}</h4>
        <p>${a.description}</p>
      </div>
    </div>
  `).join('');
  document.getElementById('achievementList').innerHTML = html || '<p>暂无成就</p>';
}

// 加载套餐信息
async function loadSubscription() {
  try {
    const res = await fetch(`${API_BASE}/user/subscription`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderSubscription(data);
  } catch (e) {
    console.error('加载套餐信息失败:', e);
    // 默认显示免费版
    renderSubscription({ isPro: false, subscriptionType: null });
  }
}

// 渲染套餐信息
function renderSubscription(data) {
  const isPro = !!data.isPro;
  const subscriptionType = data.subscriptionType || data.subscription_type;
  const section = document.getElementById('subscriptionSection');
  const badge = document.getElementById('subscriptionBadge');
  const name = document.getElementById('subscriptionName');
  const details = document.getElementById('subscriptionDetails');
  const expireDate = document.getElementById('expireDate');
  const upgradeBtn = document.getElementById('upgradeBtn');

  if (isPro) {
    // Pro 用户
    section.classList.add('pro');
    badge.classList.add('pro');
    badge.textContent = 'Pro';
    
    const planNames = {
      monthly: '月度会员',
      yearly: '年度会员',
      lifetime: '终身会员'
    };
    name.textContent = planNames[subscriptionType] || 'Pro 会员';
    
    // 显示到期时间
    if (data.expiresAt || data.pro_expires_at) {
      const expire = new Date(data.expiresAt || data.pro_expires_at);
      expireDate.textContent = expire.toLocaleDateString('zh-CN');
      details.style.display = 'block';
    }
    
    upgradeBtn.textContent = '升级套餐';
  } else {
    // 免费用户
    section.classList.remove('pro');
    badge.classList.remove('pro');
    badge.textContent = '免费版';
    name.textContent = '';
    details.style.display = 'none';
    upgradeBtn.textContent = '升级 Pro';
  }
}

// 保存个人资料
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        display_name: document.getElementById('displayName').value,
        bio: document.getElementById('bio').value,
        study_goal: document.getElementById('studyGoal').value,
        target_score: document.getElementById('targetScore').value ? parseInt(document.getElementById('targetScore').value) : null
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    alert('保存成功！');
    loadProfile();
  } catch (e) {
    alert('保存失败: ' + e.message);
  }
});

// 保存设置
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await fetch(`${API_BASE}/user/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        notifications_enabled: document.getElementById('notificationsEnabled').checked ? 1 : 0,
        sound_enabled: document.getElementById('soundEnabled').checked ? 1 : 0,
        auto_play_audio: document.getElementById('autoPlayAudio').checked ? 1 : 0,
        theme: document.getElementById('theme').value,
        language: document.getElementById('language').value
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    alert('设置保存成功！');
  } catch (e) {
    alert('保存失败: ' + e.message);
  }
});

// 初始化
async function init() {
  const username = localStorage.getItem('username') || '';
  document.getElementById('welcomeUser').textContent = `👤 ${username}`;

  // 立即设置默认值，不要一直显示加载中
  document.getElementById('profileName').textContent = username || '用户';
  document.getElementById('profileLevel').textContent = '1';
  document.getElementById('profilePoints').textContent = '0';

  await Promise.all([
    loadProfile(),
    loadStatistics(),
    loadAchievements(),
    loadSubscription()
  ]);
}

init();
