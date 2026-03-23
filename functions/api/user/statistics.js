// 用户学习统计 API
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

  // 获取统计数据
  let stats = await env.DB.prepare('SELECT * FROM user_statistics WHERE user_id = ?').bind(payload.id).first();

  // 如果没有统计数据，创建一个
  if (!stats) {
    await env.DB.prepare('INSERT INTO user_statistics (user_id) VALUES (?)').bind(payload.id).run();
    stats = await env.DB.prepare('SELECT * FROM user_statistics WHERE user_id = ?').bind(payload.id).first();
  }

  // 计算正确率
  const accuracy = stats.total_questions_answered > 0
    ? Math.round((stats.correct_answers / stats.total_questions_answered) * 100)
    : 0;

  // 获取最近的答题记录
  const recentAttempts = await env.DB.prepare(`
    SELECT a.*, q.type, q.question
    FROM attempts a
    JOIN questions q ON a.question_id = q.id
    WHERE a.user_id = ?
    ORDER BY a.attempted_at DESC
    LIMIT 10
  `).bind(payload.id).all();

  // 获取各题型的正确率
  const typeStats = await env.DB.prepare(`
    SELECT
      q.type,
      COUNT(*) as total,
      SUM(a.is_correct) as correct
    FROM attempts a
    JOIN questions q ON a.question_id = q.id
    WHERE a.user_id = ?
    GROUP BY q.type
  `).bind(payload.id).all();

  // 获取最近的练习 session
  const recentSessions = await env.DB.prepare(`
    SELECT * FROM sessions
    WHERE user_id = ?
    ORDER BY completed_at DESC
    LIMIT 5
  `).bind(payload.id).all();

  return jsonResp({
    ...stats,
    accuracy,
    recentAttempts: recentAttempts.results || [],
    typeStats: typeStats.results || [],
    recentSessions: recentSessions.results || []
  });
}
