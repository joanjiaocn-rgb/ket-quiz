// 用户成就 API（简化版 - 返回硬编码成就）
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

  // 硬编码的成就列表（不依赖数据库）
  const defaultAchievements = [
    { id: 1, name: '初学者', description: '完成 10 道题目', icon: '🎯', type: 'questions', requirement: 10, points_reward: 50 },
    { id: 2, name: '练习达人', description: '完成 50 道题目', icon: '⭐', type: 'questions', requirement: 50, points_reward: 100 },
    { id: 3, name: '词汇达人', description: '答对 50 道词汇题', icon: '📚', type: 'vocabulary', requirement: 50, points_reward: 150 },
    { id: 4, name: '语法大师', description: '答对 50 道语法题', icon: '📝', type: 'grammar', requirement: 50, points_reward: 150 },
    { id: 5, name: '勤奋学习者', description: '连续学习 7 天', icon: '🔥', type: 'streak', requirement: 7, points_reward: 200 },
    { id: 6, name: '坚持之星', description: '连续学习 30 天', icon: '🏆', type: 'streak', requirement: 30, points_reward: 500 },
    { id: 7, name: '全能选手', description: '所有题型都练习过', icon: '🌟', type: 'all_types', requirement: 1, points_reward: 300 }
  ];

  try {
    // 先尝试查询用户已解锁的成就
    let userAchievements = [];
    try {
      const result = await env.DB.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').bind(payload.id).all();
      userAchievements = result.results || [];
    } catch (e) {
      console.log('用户成就表不存在，使用空列表');
    }

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

    // 检查用户是否达成任何成就（基于答题数）
    let totalQuestions = 0;
    try {
      const statsResult = await env.DB.prepare('SELECT COUNT(*) as total FROM attempts WHERE user_id = ?').bind(payload.id).first();
      totalQuestions = statsResult?.total || 0;
      console.log('用户答题数:', totalQuestions);
    } catch (e) {
      console.log('无法获取答题统计，使用默认值 0');
      totalQuestions = 0;
    }

    // 标记成就解锁状态
    const achievementsWithStatus = defaultAchievements.map(a => {
      let unlocked = unlockedIds.has(a.id);

      // 如果还没解锁，检查是否应该解锁
      if (!unlocked) {
        if (a.type === 'questions' && totalQuestions >= a.requirement) {
          unlocked = true;
          console.log(`成就 "${a.name}" 解锁！答题数: ${totalQuestions}, 要求: ${a.requirement}`);
        }
      }

      console.log(`成就 "${a.name}": unlocked=${unlocked}`);
      return { ...a, unlocked };
    });

    return jsonResp({
      unlocked: [],
      all: achievementsWithStatus
    });
  } catch (e) {
    console.error('成就 API 错误:', e);
    // 出错时返回默认成就列表，第一个成就强制解锁
    return jsonResp({
      unlocked: [],
      all: defaultAchievements.map((a, index) => ({ ...a, unlocked: index === 0 }))
    });
  }
}
