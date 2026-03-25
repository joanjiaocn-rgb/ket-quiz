// 用户个人信息 API（优化版）
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

  try {
    // 优化：并行获取所有数据（减少等待时间）
    const [user, profile, settings] = await Promise.all([
      // 获取用户基本信息（只查询肯定存在的字段）
      env.DB.prepare('SELECT id, username, email, avatar FROM users WHERE id = ?').bind(payload.id).first().catch(() => null),
      // 获取用户详细资料
      env.DB.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(payload.id).first().catch(() => null),
      // 获取用户设置
      env.DB.prepare('SELECT * FROM user_settings WHERE user_id = ?').bind(payload.id).first().catch(() => null)
    ]);

    if (!user) {
      // 如果获取不到用户，至少返回一个基本的用户对象
      return jsonResp({
        user: { id: payload.id, username: '用户', level: 1, total_points: 0 },
        profile: null,
        settings: null
      });
    }

    return jsonResp({
      user,
      profile: profile || null,
      settings: settings || null
    });
  } catch (e) {
    console.error('个人资料 API 错误:', e);
    // 如果出错，返回默认值
    return jsonResp({
      user: { id: payload.id, username: '用户', level: 1, total_points: 0 },
      profile: null,
      settings: null
    });
  }
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
