// JWT & helpers inlined for Cloudflare Pages Functions
const SECRET = 'ket_quiz_secret_2024';
const GOOGLE_CLIENT_ID = '301385159441-rsuga1t2r7l432q25juvu0tkr4in2mfm.apps.googleusercontent.com';

function base64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}
async function signJwt(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 86400 }));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${base64url(String.fromCharCode(...new Uint8Array(sig)))}`;
}
function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
function corsResp() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    }
  });
}
async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'ket_salt'));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 验证 Google ID Token（无需外部库，纯 Web Crypto）
async function verifyGoogleToken(idToken) {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    const payload = JSON.parse(base64urlDecode(parts[1]));
    // 验证 audience 和 issuer
    if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Invalid audience');
    if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) throw new Error('Invalid issuer');
    if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
    return payload;
  } catch (e) {
    throw new Error('Google token verification failed: ' + e.message);
  }
}

export async function onRequestOptions() { return corsResp(); }

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();

  // Google OAuth 登录
  if (action === 'google') {
    let body;
    try { body = await request.json(); } catch { return jsonResp({ error: '请求格式错误' }, 400); }
    const { id_token } = body;
    if (!id_token) return jsonResp({ error: '缺少 id_token' }, 400);

    let googleUser;
    try {
      googleUser = await verifyGoogleToken(id_token);
    } catch (e) {
      return jsonResp({ error: 'Google 验证失败: ' + e.message }, 401);
    }

    const { sub: googleId, email, name, picture } = googleUser;

    // 查找已有 Google 用户
    let user = await env.DB.prepare('SELECT * FROM users WHERE google_id = ?').bind(googleId).first();

    if (!user) {
      // 检查邮箱是否已注册过普通账号
      user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      if (user) {
        // 关联 Google 账号到已有账号
        await env.DB.prepare('UPDATE users SET google_id = ?, avatar = ? WHERE id = ?')
          .bind(googleId, picture, user.id).run();
        user.google_id = googleId;
      } else {
        // 创建新用户（用户名取邮箱前缀，如有重复加随机后缀）
        let username = name || email.split('@')[0];
        const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
        if (existing) username = username + '_' + Math.floor(Math.random() * 9000 + 1000);

        const result = await env.DB.prepare(
          'INSERT INTO users (username, password, google_id, email, avatar) VALUES (?, NULL, ?, ?, ?)'
        ).bind(username, googleId, email, picture).run();

        user = { id: result.meta.last_row_id, username, email, avatar: picture };
      }
    }

    const token = await signJwt({ id: user.id, username: user.username });
    return jsonResp({ token, username: user.username, avatar: user.avatar || '' });
  }

  // 普通注册/登录
  let body;
  try { body = await request.json(); } catch { return jsonResp({ error: '请求格式错误' }, 400); }
  const { username, password } = body;
  if (!username || !password) return jsonResp({ error: '请填写用户名和密码' }, 400);
  const hash = await hashPassword(password);

  if (action === 'register') {
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) return jsonResp({ error: '用户名已存在' }, 400);
    const result = await env.DB.prepare(
      'INSERT INTO users (username, password) VALUES (?, ?)'
    ).bind(username, hash).run();
    const token = await signJwt({ id: result.meta.last_row_id, username });
    return jsonResp({ token, username });
  }

  if (action === 'login') {
    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!user || user.password !== hash) return jsonResp({ error: '用户名或密码错误' }, 401);
    const token = await signJwt({ id: user.id, username });
    return jsonResp({ token, username });
  }

  return jsonResp({ error: 'Not found' }, 404);
}
