// 用户成就 API（优化版）
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
    // 优化：一次性获取所有成就和用户解锁情况（减少查询次数）
    const [allAchievements, userAchievements] = await Promise.all([
      env.DB.prepare('SELECT * FROM achievements ORDER BY id').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').bind(payload.id).all().catch(() => ({ results: [] }))
    ]);

    const unlockedIds = new Set((userAchievements.results || []).map(ua => ua.achievement_id));

    const achievementsWithStatus = (allAchievements.results || []).map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id)
    }));

    // 获取用户已解锁的成就详情（按需加载）
    const unlockedAchievements = [];
    if (unlockedIds.size > 0) {
      try {
        const unlockedResult = await env.DB.prepare(`
          SELECT ua.*, a.name, a.description, a.icon, a.type, a.requirement, a.points_reward
          FROM user_achievements ua
          JOIN achievements a ON ua.achievement_id = a.id
          WHERE ua.user_id = ?
          ORDER BY ua.unlocked_at DESC
        `).bind(payload.id).all();
        unlockedAchievements.push(...(unlockedResult.results || []));
      } catch (e) {
        console.error('获取已解锁成就失败:', e);
      }
    }

    return jsonResp({
      unlocked: unlockedAchievements,
      all: achievementsWithStatus
    });
  } catch (e) {
    console.error('成就 API 错误:', e);
    // 如果表不存在，返回空成就列表
    return jsonResp({
      unlocked: [],
      all: []
    });
  }
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

  // 优化：一次性获取所有需要的统计数据
  const [totalResult, vocabResult, grammarResult, typesResult, userAchievements] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as total FROM attempts WHERE user_id = ?').bind(payload.id).first(),
    env.DB.prepare(`
      SELECT SUM(a.is_correct) as correct
      FROM attempts a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = ? AND q.type = 'vocabulary'
    `).bind(payload.id).first(),
    env.DB.prepare(`
      SELECT SUM(a.is_correct) as correct
      FROM attempts a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = ? AND q.type = 'grammar'
    `).bind(payload.id).first(),
    env.DB.prepare(`
      SELECT DISTINCT q.type
      FROM attempts a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = ?
    `).bind(payload.id).all(),
    env.DB.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').bind(payload.id).all()
  ]);

  const totalQuestions = totalResult?.total || 0;
  const vocabCorrect = vocabResult?.correct || 0;
  const grammarCorrect = grammarResult?.correct || 0;
  const practicedTypes = new Set((typesResult.results || []).map(t => t.type));
  const unlockedIds = new Set((userAchievements.results || []).map(ua => ua.achievement_id));

  // 获取所有成就
  const allAchievements = await env.DB.prepare('SELECT * FROM achievements').all();

  // 检查每个成就
  for (const achievement of (allAchievements.results || [])) {
    if (unlockedIds.has(achievement.id)) continue;

    let unlocked = false;

    switch (achievement.type) {
      case 'questions':
        unlocked = totalQuestions >= achievement.requirement;
        break;
      case 'streak':
        // 连续学习天数（简化处理，暂时不检查）
        unlocked = false;
        break;
      case 'vocabulary':
        unlocked = vocabCorrect >= achievement.requirement;
        break;
      case 'grammar':
        unlocked = grammarCorrect >= achievement.requirement;
        break;
      case 'all_types':
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
