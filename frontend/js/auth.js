const API = '';
const GOOGLE_CLIENT_ID = '301385159441-rsuga1t2r7l432q25juvu0tkr4in2mfm.apps.googleusercontent.com';

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').classList.remove('hidden');
  document.getElementById('authMsg').textContent = '';
}

// Google 登录回调
async function handleGoogleCredential(response) {
  const msg = document.getElementById('authMsg');
  msg.textContent = '正在登录...';
  msg.className = 'msg';
  try {
    const res = await fetch(`${API}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: response.credential })
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

// 等 Google SDK 加载完成后初始化
function initGoogle() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  // 把官方 Google 按钮渲染到 #googleBtnWrapper
  google.accounts.id.renderButton(
    document.getElementById('googleBtnWrapper'),
    {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'signin_with',
      locale: 'zh-CN',
      shape: 'rectangular',
    }
  );
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

if (localStorage.getItem('token')) location.href = 'dashboard.html';
