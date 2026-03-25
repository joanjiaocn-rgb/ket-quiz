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
    console.log('开始加载个人资料...');
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('响应状态:', res.status);
    const data = await res.json();
    console.log('个人资料数据:', data);
    if (data.error) throw new Error(data.error);
    currentUser = data;
    renderProfile(data);
  } catch (e) {
    console.error('加载个人资料失败:', e);
    // 如果加载失败，显示默认值
    document.getElementById('profileName').textContent = '用户';
  }
}

function renderProfile(data) {
  console.log('渲染个人资料:', data);
  const { user, profile, settings } = data;

  // 头部信息 - 添加安全检查
  if (user) {
    if (user.avatar) {
      document.getElementById('profileAvatar').innerHTML = `<img src="${user.avatar}" alt="avatar">`;
    }
    document.getElementById('profileName').textContent = user.display_name || user.username || '用户';
    document.getElementById('profileBio').textContent = user.bio || '';
    document.getElementById('profileLevel').textContent = user.level || 1;
    document.getElementById('profilePoints').textContent = user.total_points || 0;
    document.getElementById('welcomeUser').textContent = `👤 ${user.username || ''}`;
  } else {
    console.error('用户数据不存在');
    document.getElementById('profileName').textContent = '用户';
  }
  
  // 无论如何，确保名字不会一直显示加载中
  if (document.getElementById('profileName').textContent === '加载中...') {
    document.getElementById('profileName').textContent = '用户';
  }

  // 表单 - 添加安全检查
  try {
    if (user?.display_name) document.getElementById('displayName').value = user.display_name;
    if (user?.bio) document.getElementById('bio').value = user.bio;
    if (profile?.study_goal) document.getElementById('studyGoal').value = profile.study_goal;
    if (profile?.target_score) document.getElementById('targetScore').value = profile.target_score;
  } catch (e) {
    console.error('填充表单失败:', e);
  }

  // 设置 - 添加安全检查
  try {
    if (settings) {
      document.getElementById('notificationsEnabled').checked = !!settings.notifications_enabled;
      document.getElementById('soundEnabled').checked = !!settings.sound_enabled;
      document.getElementById('autoPlayAudio').checked = !!settings.auto_play_audio;
      if (settings.theme) document.getElementById('theme').value = settings.theme;
      if (settings.language) document.getElementById('language').value = settings.language;
    }
  } catch (e) {
    console.error('填充设置失败:', e);
  }
}

async function loadStatistics() {
  try {
    console.log('开始加载统计数据...');
    const res = await fetch(`${API_BASE}/user/statistics`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const stats = await res.json();
    console.log('统计数据:', stats);
    if (stats.error) throw new Error(stats.error);
    renderStatistics(stats);
  } catch (e) {
    console.error('加载统计数据失败:', e);
  }
}

function renderStatistics(stats) {
  console.log('渲染统计数据:', stats);
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
    console.log('开始加载成就...');
    const res = await fetch(`${API_BASE}/user/achievements`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    console.log('成就数据:', data);
    if (data.error) throw new Error(data.error);
    renderAchievements(data.all);
  } catch (e) {
    console.error('加载成就失败:', e);
  }
}

function renderAchievements(achievements) {
  console.log('渲染成就:', achievements);
  const html = (achievements || []).map(a => `
    <div class="achievement-item ${a.unlocked ? '' : 'locked'}">
      <div class="achievement-icon">${a.icon || '🏅'}</div>
      <div class="achievement-info">
        <h4>${a.name || '未知成就'}</h4>
        <p>${a.description || ''}</p>
      </div>
    </div>
  `).join('');
  document.getElementById('achievementList').innerHTML = html || '<p>暂无成就</p>';
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
  console.log('初始化个人中心页面...');
  const username = localStorage.getItem('username') || '';
  document.getElementById('welcomeUser').textContent = `👤 ${username}`;

  // 显示初始加载状态
  document.getElementById('statsCards').innerHTML = `
    <div class="stat-card">
      <div class="number">-</div>
      <div class="label">总答题数</div>
    </div>
    <div class="stat-card">
      <div class="number">-</div>
      <div class="label">正确率</div>
    </div>
    <div class="stat-card">
      <div class="number">-</div>
      <div class="label">练习场次</div>
    </div>
    <div class="stat-card">
      <div class="number">-</div>
      <div class="label">连续学习</div>
    </div>
  `;
  document.getElementById('achievementList').innerHTML = '<div class="loading">加载中...</div>';

  // 使用 allSettled 确保即使某个请求失败，其他请求也能继续
  const results = await Promise.allSettled([
    loadProfile(),
    loadStatistics(),
    loadAchievements()
  ]);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`请求 ${index} 失败:`, result.reason);
    }
  });

  console.log('所有数据加载完成！');
}

init();
