// 用户学习统计 API - 从 attempts 表实时计算
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

  // 从 attempts 表获取统计数据
  const totalResult = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM attempts WHERE user_id = ?'
  ).bind(payload.id).first();

  const correctResult = await env.DB.prepare(
    'SELECT COUNT(*) as correct FROM attempts WHERE user_id = ? AND is_correct = 1'
  ).bind(payload.id).first();

  const totalAnswered = totalResult?.total || 0;
  const correctAnswers = correctResult?.correct || 0;
  const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

  // 从 sessions 表获取会话数
  const sessionsResult = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM sessions WHERE user_id = ?'
  ).bind(payload.id).first();

  const totalSessions = sessionsResult?.total || 0;

  // 计算连续学习天数
  const lastStudyDate = await env.DB.prepare(
    "SELECT DATE(attempted_at) as date FROM attempts WHERE user_id = ? ORDER BY attempted_at DESC LIMIT 1"
  ).bind(payload.id).first();

  let streakDays = 0;
  if (lastStudyDate?.date) {
    const today = new Date();
    const lastDate = new Date(lastStudyDate.date);
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      // 如果是今天或昨天，计算连续天数
      streakDays = 1;
      let checkDate = new Date(lastDate);

      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasData = await env.DB.prepare(
          `SELECT COUNT(*) as c FROM attempts
           WHERE user_id = ? AND DATE(attempted_at) = ?`
        ).bind(payload.id, dateStr).first();

        if (hasData?.c > 0) {
          streakDays++;
        } else {
          break;
        }
      }
    }
  }

  // 计算总学习时间（秒）
  const studyTimeResult = await env.DB.prepare(
    'SELECT SUM(time_spent) as total_time FROM attempts WHERE user_id = ?'
  ).bind(payload.id).first();

  const totalStudyTime = studyTimeResult?.total_time || 0;

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

  return jsonResp({
    total_questions_answered: totalAnswered,
    correct_answers: correctAnswers,
    accuracy: accuracy,
    total_sessions: totalSessions,
    streak_days: streakDays,
    total_study_time: totalStudyTime,
    last_study_date: lastStudyDate?.date || null,
    recentAttempts: recentAttempts.results || [],
    typeStats: typeStats.results || []
  });
}
