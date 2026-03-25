// 用户个人信息 API
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

  // 获取用户基本信息（只查询原始表中肯定存在的字段）
  const user = await env.DB.prepare('SELECT id, username, email, avatar FROM users WHERE id = ?').bind(payload.id).first();
  if (!user) return jsonResp({ error: '用户不存在' }, 404);

  // 获取用户详细资料
  const profile = await env.DB.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(payload.id).first();

  // 获取用户统计数据
  const stats = await env.DB.prepare('SELECT * FROM user_statistics WHERE user_id = ?').bind(payload.id).first();

  // 获取用户设置
  const settings = await env.DB.prepare('SELECT * FROM user_settings WHERE user_id = ?').bind(payload.id).first();

  return jsonResp({
    user,
    profile: profile || null,
    statistics: stats || null,
    settings: settings || null
  });
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

  const { display_name, bio, ...profileData } = body;

  // 更新用户基本信息
  if (display_name !== undefined || bio !== undefined) {
    const updates = [];
    const params = [];
    if (display_name !== undefined) { updates.push('display_name = ?'); params.push(display_name); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(payload.id);

    await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  }

  // 更新或创建用户详细资料
  if (Object.keys(profileData).length > 0) {
    const existing = await env.DB.prepare('SELECT id FROM user_profiles WHERE user_id = ?').bind(payload.id).first();

    if (existing) {
      const updates = [];
      const params = [];
      const allowedFields = ['birth_date', 'gender', 'country', 'city', 'target_score', 'study_goal', 'preferred_learning_time'];

      for (const field of allowedFields) {
        if (profileData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(profileData[field]);
        }
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(payload.id);
        await env.DB.prepare(`UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`).bind(...params).run();
      }
    } else {
      const fields = ['user_id'];
      const placeholders = ['?'];
      const params = [payload.id];
      const allowedFields = ['birth_date', 'gender', 'country', 'city', 'target_score', 'study_goal', 'preferred_learning_time'];

      for (const field of allowedFields) {
        if (profileData[field] !== undefined) {
          fields.push(field);
          placeholders.push('?');
          params.push(profileData[field]);
        }
      }

      await env.DB.prepare(`INSERT INTO user_profiles (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`).bind(...params).run();
    }
  }

  return jsonResp({ success: true });
}
