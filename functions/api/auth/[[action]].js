import { signJwt, json, cors } from '../_utils.js';

async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'ket_salt'));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestOptions() { return cors(); }

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();
  const { username, password } = await request.json();
  if (!username || !password) return json({ error: '请填写用户名和密码' }, 400);
  const hash = await hashPassword(password);

  if (action === 'register') {
    const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) return json({ error: '用户名已存在' }, 400);
    const result = await env.DB.prepare('INSERT INTO users (username, password) VALUES (?, ?)').bind(username, hash).run();
    const token = await signJwt({ id: result.meta.last_row_id, username });
    return json({ token, username });
  }

  if (action === 'login') {
    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!user || user.password !== hash) return json({ error: '用户名或密码错误' }, 401);
    const token = await signJwt({ id: user.id, username });
    return json({ token, username });
  }

  return json({ error: 'Not found' }, 404);
}
