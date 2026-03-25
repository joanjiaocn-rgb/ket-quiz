const SECRET = 'ket_quiz_secret_2024';

function base64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}
async function verifyJwt(token) {
  try {
    const [header, body, sig] = token.split('.');
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = Uint8Array.from(base64urlDecode(sig), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}
function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
function corsResp() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    }
  });
}
async function getUser(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  return await verifyJwt(token);
}

export async function onRequestOptions() { return corsResp(); }

export async function onRequest({ request, env, params }) {
  if (request.method === 'OPTIONS') return corsResp();
  const action = params.action;
  const user = await getUser(request);
  if (!user) return jsonResp({ error: '未登录' }, 401);

  if (request.method === 'POST' && action === 'attempt') {
    const { question_id, user_answer, is_correct, time_spent } = await request.json();
    await env.DB.prepare(
      'INSERT INTO attempts (user_id, question_id, user_answer, is_correct, time_spent) VALUES (?, ?, ?, ?, ?)'
    ).bind(user.id, question_id, user_answer, is_correct ? 1 : 0, time_spent).run();
    return jsonResp({ ok: true });
  }

  if (request.method === 'POST' && action === 'session') {
    const { type, score, total, duration } = await request.json();
    await env.DB.prepare(
      'INSERT INTO sessions (user_id, type, score, total, duration) VALUES (?, ?, ?, ?, ?)'
    ).bind(user.id, type, score, total, duration).run();
    return jsonResp({ ok: true });
  }

  if (request.method === 'GET' && action === 'wrong') {
    const result = await env.DB.prepare(`
      SELECT q.id, q.type, q.question, q.options, q.answer, q.explanation,
             a.user_answer, a.attempted_at
      FROM attempts a JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = ? AND a.is_correct = 0
      ORDER BY a.attempted_at DESC LIMIT 50
    `).bind(user.id).all();
    return jsonResp(result.results.map(q => ({ ...q, options: q.options ? JSON.parse(q.options) : null })));
  }

  if (request.method === 'GET' && action === 'stats') {
    // 优化：一次性获取所有题型的统计（减少数据库查询次数）
    const typeStats = await env.DB.prepare(`
      SELECT
        q.type,
        COUNT(*) as total,
        SUM(a.is_correct) as correct
      FROM attempts a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = ?
      GROUP BY q.type
    `).bind(user.id).all();

    // 初始化默认值
    const stats = {
      vocabulary: { total: 0, correct: 0 },
      grammar: { total: 0, correct: 0 },
      reading: { total: 0, correct: 0 },
      writing: { total: 0, correct: 0 },
      listening: { total: 0, correct: 0 },
      speaking: { total: 0, correct: 0 }
    };

    // 填充查询结果
    for (const row of (typeStats.results || [])) {
      if (stats[row.type]) {
        stats[row.type] = { total: row.total, correct: row.correct };
      }
    }

    const sessions = await env.DB.prepare(
      'SELECT * FROM sessions WHERE user_id=? ORDER BY completed_at DESC LIMIT 10'
    ).bind(user.id).all();

    return jsonResp({ stats, sessions: sessions.results });
  }

  return jsonResp({ error: 'Not found' }, 404);
}
