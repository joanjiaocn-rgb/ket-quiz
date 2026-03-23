const API = '';
const GOOGLE_CLIENT_ID = '419114478696-9arvipkrsbrk1kkpvdlben30a7akv23s.apps.googleusercontent.com';
// 动态获取当前域名，不再硬编码，适配任意部署环境
const REDIRECT_URI = location.origin + '/';

// ===== 优先处理 Google 回调（页面加载就检查 hash）=====
(async function () {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const id_token = params.get('id_token');
  if (!id_token) return;

  // 清除 hash，避免刷新重复处理
  history.replaceState(null, '', location.pathname);

  // 等 DOM 加载完再操作
  document.addEventListener('DOMContentLoaded', async () => {
    const msg = document.getElementById('authMsg');
    if (msg) { msg.textContent = '正在登录...'; msg.className = 'msg'; }

    try {
      const res = await fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token })
      });
      const data = await res.json();
      if (!res.ok) {
        if (msg) { msg.textContent = data.error || 'Google 登录失败'; msg.className = 'msg error'; }
        console.error('Google登录失败:', data);
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      if (data.avatar) localStorage.setItem('avatar', data.avatar);
      location.href = 'dashboard.html';
    } catch (e) {
      console.error('Google登录网络错误:', e);
      if (msg) { msg.textContent = '网络错误，请重试'; msg.className = 'msg error'; }
    }
  });
})();

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').classList.remove('hidden');
  document.getElementById('authMsg').textContent = '';
}

// 跳转到 Google 授权页
function loginWithGoogle() {
  const nonce = Math.random().toString(36).slice(2) + Date.now();
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: nonce,
    prompt: 'select_account',
  });
  window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
}

// DOM 加载完后绑定事件
document.addEventListener('DOMContentLoaded', function () {
  // 已登录跳转
  if (localStorage.getItem('token')) {
    location.href = 'dashboard.html';
    return;
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
});
