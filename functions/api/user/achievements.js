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

  // 直接标记第一个成就为已解锁（初学者）
  const achievementsWithStatus = defaultAchievements.map((a, index) => {
    return { ...a, unlocked: index === 0 };
  });

  return jsonResp({
    unlocked: [],
    all: achievementsWithStatus
  });
}
