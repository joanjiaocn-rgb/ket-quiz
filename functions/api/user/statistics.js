// 用户学习统计 API - 从 attempts 表实时计算（优化版）
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

  // 一次性获取所有统计数据（减少数据库查询次数）
  const statsResult = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
      SUM(time_spent) as total_time
    FROM attempts WHERE user_id = ?
  `).bind(payload.id).first();

  const totalAnswered = statsResult?.total || 0;
  const correctAnswers = statsResult?.correct || 0;
  const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
  const totalStudyTime = statsResult?.total_time || 0;

  // 获取会话数
  const sessionsResult = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM sessions WHERE user_id = ?'
  ).bind(payload.id).first();

  const totalSessions = sessionsResult?.total || 0;

  // 优化：一次性获取所有有记录的日期，然后计算连续天数
  const studyDatesResult = await env.DB.prepare(`
    SELECT DISTINCT DATE(attempted_at) as date
    FROM attempts WHERE user_id = ?
    ORDER BY date DESC
  `).bind(payload.id).all();

  const studyDates = studyDatesResult?.results?.map(r => r.date) || [];
  const lastStudyDate = studyDates[0] || null;

  let streakDays = 0;
  if (studyDates.length > 0) {
    const today = new Date();
    const lastDate = new Date(studyDates[0]);
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      streakDays = 1;
      let prevDate = new Date(studyDates[0]);

      for (let i = 1; i < studyDates.length; i++) {
        const currDate = new Date(studyDates[i]);
        const dayDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          streakDays++;
          prevDate = currDate;
        } else {
          break;
        }
      }
    }
  }

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
    last_study_date: lastStudyDate,
    recentAttempts: recentAttempts.results || [],
    typeStats: typeStats.results || []
  });
}
