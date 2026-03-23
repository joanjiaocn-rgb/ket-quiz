// 用户设置 API
import { verifyJwt, json as jsonResp, cors as corsResp } from '../../_utils.js';

export async function onRequestOptions() { return corsResp(); }

export async function onRequestGet({ request, env }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResp({ error: '未登录' }, 401);
  }

  let payload;
  try {
    payload = await verifyJwt(authHeader.split(' ')[1]);
  } catch {
    return jsonResp({ error: 'token 无效' }, 401);
  }

  // 获取设置
  let settings = await env.DB.prepare('SELECT * FROM user_settings WHERE user_id = ?').bind(payload.id).first();

  // 如果没有设置，创建默认设置
  if (!settings) {
    await env.DB.prepare('INSERT INTO user_settings (user_id) VALUES (?)').bind(payload.id).run();
    settings = await env.DB.prepare('SELECT * FROM user_settings WHERE user_id = ?').bind(payload.id).first();
  }

  return jsonResp(settings);
}

export async function onRequestPut({ request, env }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResp({ error: '未登录' }, 401);
  }

  let payload;
  try {
    payload = await verifyJwt(authHeader.split(' ')[1]);
  } catch {
    return jsonResp({ error: 'token 无效' }, 401);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResp({ error: '请求格式错误' }, 400); }

  const existing = await env.DB.prepare('SELECT id FROM user_settings WHERE user_id = ?').bind(payload.id).first();

  const allowedFields = ['notifications_enabled', 'sound_enabled', 'auto_play_audio', 'theme', 'language'];
  const updates = [];
  const params = [];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(body[field]);
    }
  }

  if (updates.length === 0) {
    return jsonResp({ error: '没有可更新的字段' }, 400);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(payload.id);

  if (existing) {
    await env.DB.prepare(`UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`).bind(...params).run();
  } else {
    const fields = ['user_id', ...updates.map(u => u.split(' = ')[0])];
    const placeholders = fields.map(() => '?');
    await env.DB.prepare(`INSERT INTO user_settings (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`).bind(...params).run();
  }

  return jsonResp({ success: true });
}
