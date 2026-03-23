// 成就 API - 获取所有成就列表
import { json as jsonResp, cors as corsResp } from '../../_utils.js';

export async function onRequestOptions() { return corsResp(); }

export async function onRequestGet({ env }) {
  const achievements = await env.DB.prepare('SELECT * FROM achievements ORDER BY id').all();
  return jsonResp({ achievements: achievements.results || [] });
}
