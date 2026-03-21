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

export async function onRequestOptions() { return corsResp(); }

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
  return jsonResp(questions);
}
