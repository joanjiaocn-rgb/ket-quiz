import { json, cors, getUser } from '../../_utils.js';

export async function onRequestOptions() { return cors(); }

export async function onRequest({ request, env, params }) {
  if (request.method === 'OPTIONS') return cors();
  const action = params.action;
  const user = await getUser(request);
  if (!user) return json({ error: '未登录' }, 401);

  if (request.method === 'POST' && action === 'attempt') {
    const { question_id, user_answer, is_correct, time_spent } = await request.json();
    await env.DB.prepare(
      'INSERT INTO attempts (user_id, question_id, user_answer, is_correct, time_spent) VALUES (?, ?, ?, ?, ?)'
    ).bind(user.id, question_id, user_answer, is_correct ? 1 : 0, time_spent).run();
    return json({ ok: true });
  }

  if (request.method === 'POST' && action === 'session') {
    const { type, score, total, duration } = await request.json();
    await env.DB.prepare(
      'INSERT INTO sessions (user_id, type, score, total, duration) VALUES (?, ?, ?, ?, ?)'
    ).bind(user.id, type, score, total, duration).run();
    return json({ ok: true });
  }

  if (request.method === 'GET' && action === 'wrong') {
    const result = await env.DB.prepare(`
      SELECT q.id, q.type, q.question, q.options, q.answer, q.explanation,
             a.user_answer, a.attempted_at
      FROM attempts a JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = ? AND a.is_correct = 0
      ORDER BY a.attempted_at DESC LIMIT 50
    `).bind(user.id).all();
    return json(result.results.map(q => ({ ...q, options: q.options ? JSON.parse(q.options) : null })));
  }

  if (request.method === 'GET' && action === 'stats') {
    const types = ['vocabulary', 'grammar', 'reading', 'writing', 'listening', 'speaking'];
    const stats = {};
    for (const type of types) {
      const total = await env.DB.prepare(
        'SELECT COUNT(*) as c FROM attempts a JOIN questions q ON a.question_id=q.id WHERE a.user_id=? AND q.type=?'
      ).bind(user.id, type).first();
      const correct = await env.DB.prepare(
        'SELECT COUNT(*) as c FROM attempts a JOIN questions q ON a.question_id=q.id WHERE a.user_id=? AND q.type=? AND a.is_correct=1'
      ).bind(user.id, type).first();
      stats[type] = { total: total?.c || 0, correct: correct?.c || 0 };
    }
    const sessions = await env.DB.prepare(
      'SELECT * FROM sessions WHERE user_id=? ORDER BY completed_at DESC LIMIT 10'
    ).bind(user.id).all();
    return json({ stats, sessions: sessions.results });
  }

  return json({ error: 'Not found' }, 404);
}
