// 用户成就 API
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

  // 获取用户已解锁的成就
  const userAchievements = await env.DB.prepare(`
    SELECT ua.*, a.name, a.description, a.icon, a.type, a.requirement, a.points_reward
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ?
    ORDER BY ua.unlocked_at DESC
  `).bind(payload.id).all();

  // 获取所有成就，标记哪些已解锁
  const allAchievements = await env.DB.prepare('SELECT * FROM achievements ORDER BY id').all();
  const unlockedIds = new Set((userAchievements.results || []).map(ua => ua.achievement_id));

  const achievementsWithStatus = (allAchievements.results || []).map(a => ({
    ...a,
    unlocked: unlockedIds.has(a.id)
  }));

  return jsonResp({
    unlocked: userAchievements.results || [],
    all: achievementsWithStatus
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

  // 检查是否达成新成就
  const newlyUnlocked = [];

  // 获取用户统计数据
  const stats = await env.DB.prepare('SELECT * FROM user_statistics WHERE user_id = ?').bind(payload.id).first();
  if (!stats) {
    return jsonResp({ newlyUnlocked: [] });
  }

  // 获取所有成就
  const allAchievements = await env.DB.prepare('SELECT * FROM achievements').all();

  // 获取用户已解锁的成就
  const userAchievements = await env.DB.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').bind(payload.id).all();
  const unlockedIds = new Set((userAchievements.results || []).map(ua => ua.achievement_id));

  // 检查每个成就
  for (const achievement of (allAchievements.results || [])) {
    if (unlockedIds.has(achievement.id)) continue;

    let unlocked = false;

    switch (achievement.type) {
      case 'questions':
        unlocked = stats.total_questions_answered >= achievement.requirement;
        break;
      case 'streak':
        unlocked = stats.streak_days >= achievement.requirement;
        break;
      case 'vocabulary':
        // 统计词汇题正确数
        const vocabStats = await env.DB.prepare(`
          SELECT SUM(a.is_correct) as correct
          FROM attempts a
          JOIN questions q ON a.question_id = q.id
          WHERE a.user_id = ? AND q.type = 'vocabulary'
        `).bind(payload.id).first();
        unlocked = (vocabStats?.correct || 0) >= achievement.requirement;
        break;
      case 'grammar':
        // 统计语法题正确数
        const grammarStats = await env.DB.prepare(`
          SELECT SUM(a.is_correct) as correct
          FROM attempts a
          JOIN questions q ON a.question_id = q.id
          WHERE a.user_id = ? AND q.type = 'grammar'
        `).bind(payload.id).first();
        unlocked = (grammarStats?.correct || 0) >= achievement.requirement;
        break;
      case 'all_types':
        // 检查是否所有题型都练习过
        const types = await env.DB.prepare(`
          SELECT DISTINCT q.type
          FROM attempts a
          JOIN questions q ON a.question_id = q.id
          WHERE a.user_id = ?
        `).bind(payload.id).all();
        const practicedTypes = new Set((types.results || []).map(t => t.type));
        const allTypes = ['vocabulary', 'grammar', 'reading', 'writing', 'listening', 'speaking'];
        unlocked = allTypes.every(t => practicedTypes.has(t));
        break;
    }

    if (unlocked) {
      // 解锁成就
      await env.DB.prepare('INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').bind(payload.id, achievement.id).run();

      // 奖励积分
      if (achievement.points_reward > 0) {
        await env.DB.prepare('UPDATE users SET total_points = total_points + ? WHERE id = ?').bind(achievement.points_reward, payload.id).run();
      }

      newlyUnlocked.push(achievement);
    }
  }

  return jsonResp({ newlyUnlocked });
}
