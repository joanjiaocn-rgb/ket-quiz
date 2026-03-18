const API = '';

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').classList.remove('hidden');
  document.getElementById('authMsg').textContent = '';
}

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
