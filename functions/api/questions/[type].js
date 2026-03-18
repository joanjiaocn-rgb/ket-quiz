import { json, cors } from '../../_utils.js';

export async function onRequestOptions() { return cors(); }

export async function onRequestGet({ request, env, params }) {
  const type = params.type || 'all';
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit')) || 10;

  let result;
  if (type === 'all') {
    result = await env.DB.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?').bind(limit).all();
  } else {
    result = await env.DB.prepare('SELECT * FROM questions WHERE type = ? ORDER BY RANDOM() LIMIT ?').bind(type, limit).all();
  }

  const questions = result.results.map(q => ({ ...q, options: q.options ? JSON.parse(q.options) : null }));
  return json(questions);
}
