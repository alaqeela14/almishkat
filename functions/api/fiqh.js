export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const password = request.headers.get('X-Admin-Password') || url.searchParams.get('password');
  const isAdmin = password && env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD;

  try {
    // GET: قائمة الأسئلة
    if (method === 'GET') {
      let query = "SELECT id, author, body AS question, answer, category, created_at FROM comments WHERE post_slug = '__fiqh_question__'";
      if (!isAdmin) {
        query += " AND answer IS NOT NULL AND answer != ''";
      }
      query += " ORDER BY created_at DESC";
      const result = await env.DB.prepare(query).all();
      return new Response(JSON.stringify(result.results || []), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // PUT: حفظ الجواب
    if (method === 'PUT' || method === 'POST') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const data = await request.json();
      const { id, answer, category } = data;
      if (!id || !answer) {
        return new Response(JSON.stringify({ error: 'Missing id or answer' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      await env.DB.prepare(
        "UPDATE comments SET answer = ?, category = ? WHERE id = ? AND post_slug = '__fiqh_question__'"
      ).bind(answer, category || null, id).run();
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // DELETE: حذف سؤال
    if (method === 'DELETE') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const { id } = await request.json();
      if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      await env.DB.prepare(
        "DELETE FROM comments WHERE id = ? AND post_slug = '__fiqh_question__'"
      ).bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
}