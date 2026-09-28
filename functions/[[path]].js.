export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  let type = null, rest = '';
  if (path.startsWith('/article/')) { type = 'article'; rest = path.substring(9); }
  else if (path.startsWith('/book/')) { type = 'book'; rest = path.substring(6); }
  else if (path.startsWith('/news/')) { type = 'news'; rest = path.substring(6); }
  else return env.ASSETS.fetch(request);
  
  const parts = rest.split('/').filter(Boolean);
  if (parts.length < 1) return env.ASSETS.fetch(request);
  
  try {
    let item = null;
    const defaultImage = 'https://mishkat-new.pages.dev/assets/images/og-share.jpg?v=3';
    
    if (type === 'article') {
      if (parts.length < 2) return env.ASSETS.fetch(request);
      const catKey = parts[0];
      const idx = parseInt(parts[1]);
      const fileMap = {
        'ahlulbayt': 'articles-ahlulbayt.json',
        'insights': 'articles-insights.json',
        'doubts': 'articles-doubts.json',
        'dialogues': 'articles-dialogues.json',
        'family': 'articles-family.json',
        'general': 'articles-general.json'
      };
      const fileName = fileMap[catKey];
      if (!fileName || isNaN(idx)) return env.ASSETS.fetch(request);
      
      const jsonResp = await env.ASSETS.fetch(new URL('/' + fileName, request.url));
      const data = await jsonResp.json();
      const items = (data.items || []).slice().reverse();
      item = items[idx];
    } else if (type === 'book' || type === 'news') {
      const idx = parseInt(parts[0]);
      const fileName = type === 'book' ? 'books.json' : 'news.json';
      if (isNaN(idx)) return env.ASSETS.fetch(request);
      
      const jsonResp = await env.ASSETS.fetch(new URL('/' + fileName, request.url));
      const data = await jsonResp.json();
      const items = (data.items || []).slice().reverse();
      item = items[idx];
    }
    
    const htmlResp = await env.ASSETS.fetch(new URL('/', request.url));
    let html = await htmlResp.text();
    
    if (item) {
      const title = item.title_ar || item.title || 'منصة مشكاة | للنور والوعي';
      const description = (item.excerpt_ar || item.excerpt || item.description || 'منصة فكرية توعوية لنشر المقالات والرؤى').slice(0, 200);
      let image = item.image || item.cover || defaultImage;
      if (image.startsWith('/')) image = url.origin + image;
      else if (!image.startsWith('http')) image = url.origin + '/' + image;
      
      const fullUrl = url.origin + path;
      const eA = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      html = html
        .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, `$1${eA(title)}$2`)
        .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, `$1${eA(description)}$2`)
        .replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/i, `$1${eA(image)}$2`)
        .replace(/(<meta\s+property="og:image:secure_url"\s+content=")[^"]*(")/i, `$1${eA(image)}$2`)
        .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/i, `$1${eA(fullUrl)}$2`)
        .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i, `$1${eA(title)}$2`)
        .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i, `$1${eA(description)}$2`)
        .replace(/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/i, `$1${eA(image)}$2`)
        .replace(/(<title>)[^<]*(<\/title>)/i, `$1${eA(title)}$2`);
    }
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  } catch(e) {
    return env.ASSETS.fetch(request);
  }
}