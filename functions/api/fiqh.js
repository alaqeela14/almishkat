// ============================================
// API الأسئلة الفقهية | Fiqh Questions API
// ============================================

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // التحقق من المدير عبر كلمة المرور في الترويسة
  const authHeader = request.headers.get('Authorization') || '';
  const isAdmin = authHeader === `Bearer ${env.ADMIN_PASSWORD}`;

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
    });

  try {
    // GET — قائمة الأسئلة
    if (method === 'GET') {
      const showAll = url.searchParams.get('all') === '1';
      if (showAll && !isAdmin) return json({ success: false, error: 'غير مصرح' }, 401);

      let query = 'SELECT * FROM fiqh_questions';
      if (!showAll) query += " WHERE status = 'published'";
      query += ' ORDER BY created_at DESC';

      const result = await env.DB.prepare(query).all();
      return json({ success: true, questions: result.results || [] });
    }

    // POST — إرسال سؤال جديد (من الزوار)
    if (method === 'POST') {
      const body = await request.json();
      const name = (body.name || 'زائر').toString().trim().slice(0, 100);
      const email = (body.email || '').toString().trim().slice(0, 150);
      const question = (body.question || '').toString().trim();

      if (question.length < 5) {
        return json({ success: false, error: 'السؤال قصير جدًا' }, 400);
      }

      const result = await env.DB.prepare(
        "INSERT INTO fiqh_questions (name, email, question, status) VALUES (?, ?, ?, 'pending')"
      ).bind(name, email, question).run();

      return json({ success: true, id: result.meta.last_row_id });
    }

    // PUT — الرد + التصنيف (للمدير فقط)
    if (method === 'PUT') {
      if (!isAdmin) return json({ success: false, error: 'غير مصرح' }, 401);
      if (!id) return json({ success: false, error: 'معرف مفقود' }, 400);

      const body = await request.json();
      const answer = (body.answer || '').toString().trim();
      const category = (body.category || '').toString().trim();
      const status = (body.status || 'answered').toString().trim();

      await env.DB.prepare(
        'UPDATE fiqh_questions SET answer = ?, category = ?, status = ?, answered_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(answer, category, status, id).run();

      return json({ success: true });
    }

    // DELETE — حذف سؤال (للمدير فقط)
    if (method === 'DELETE') {
      if (!isAdmin) return json({ success: false, error: 'غير مصرح' }, 401);
      if (!id) return json({ success: false, error: 'معرف مفقود' }, 400);

      await env.DB.prepare('DELETE FROM fiqh_questions WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    return json({ success: false, error: 'طريقة غير مدعومة' }, 405);

  } catch (error) {
    return json({ success: false, error: error.message }, 500);
  }
}