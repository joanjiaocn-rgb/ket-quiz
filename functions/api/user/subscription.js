// 用户订阅 API
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

  // 获取用户订阅状态
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.id).first();

  let isPro = false;
  let subscriptionType = null;
  let expiresAt = null;

  if (user?.is_pro && user?.pro_expires_at) {
    const now = Date.now();
    const expires = new Date(user.pro_expires_at).getTime();
    isPro = expires > now;
    subscriptionType = user.subscription_type;
    expiresAt = user.pro_expires_at;
  } else if (user?.is_pro && !user?.pro_expires_at) {
    // 终身会员
    isPro = true;
    subscriptionType = 'lifetime';
  }

  // 计算今日答题数
  const todayResult = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM attempts
    WHERE user_id = ? AND DATE(attempted_at) = DATE('now')
  `).bind(payload.id).first();

  const todayQuestions = todayResult?.count || 0;

  return jsonResp({
    isPro,
    subscriptionType,
    expiresAt,
    todayQuestions,
    maxFreeQuestions: 20
  });
}

export async function onRequestPost({ request, env }) {
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

  const { plan } = await request.json();

  let expiresAt = null;
  const now = new Date();

  if (plan === 'monthly') {
    expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
  } else if (plan === 'yearly') {
    expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
  } else if (plan === 'lifetime') {
    // 终身会员不设置过期时间
  }

  await env.DB.prepare(`
    UPDATE users
    SET is_pro = 1,
        subscription_type = ?,
        pro_expires_at = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(plan, expiresAt, payload.id).run();

  return jsonResp({
    success: true,
    isPro: true,
    subscriptionType: plan,
    expiresAt
  });
}
