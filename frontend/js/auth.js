const API = '';
const GOOGLE_CLIENT_ID = '419114478696-9arvipkrsbrk1kkpvdlben30a7akv23s.apps.googleusercontent.com';
const REDIRECT_URI = location.origin + '/';

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').classList.remove('hidden');
  document.getElementById('authMsg').textContent = '';
}

// 跳转到 Google 授权页
function loginWithGoogle() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: Math.random().toString(36).slice(2),
    prompt: 'select_account',
  });
  window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
}

// 从 URL hash 中解析 Google 回调的 id_token
async function handleGoogleCallback() {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const id_token = params.get('id_token');
  if (!id_token) return;

  // 清除 hash，避免刷新重复处理
  history.replaceState(null, '', location.pathname);

  const msg = document.getElementById('authMsg');
  msg.textContent = '正在登录...';
  msg.className = 'msg';

  try {
    const res = await fetch(`${API}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token })
    });
    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.error || 'Google 登录失败';
      msg.className = 'msg error';
      return;
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    if (data.avatar) localStorage.setItem('avatar', data.avatar);
    location.href = 'dashboard.html';
  } catch {
    msg.textContent = '网络错误，请重试';
    msg.className = 'msg error';
  }
}

// 普通登录
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;
  const msg = document.getElementById('authMsg');
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { msg.textContent = data.error; msg.className = 'msg error'; return; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    location.href = 'dashboard.html';
  } catch { msg.textContent = '网络错误，请重试'; msg.className = 'msg error'; }
});

// 注册
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('regUser').value;
  const password = document.getElementById('regPass').value;
  const msg = document.getElementById('authMsg');
  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { msg.textContent = data.error; msg.className = 'msg error'; return; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    location.href = 'dashboard.html';
  } catch { msg.textContent = '网络错误，请重试'; msg.className = 'msg error'; }
});

// 已登录跳转
if (localStorage.getItem('token')) {
  location.href = 'dashboard.html';
} else {
  // 处理 Google 回调
  handleGoogleCallback();
}
