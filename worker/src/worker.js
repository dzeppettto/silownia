const REPO = 'dzeppettto/silownia';
const ISSUE_URL = 'https://api.github.com/repos/' + REPO + '/issues';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response('', { status: 204, headers: cors() });
    }
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/api/feedback') {
      return new Response('Not found', { status: 404, headers: cors() });
    }
    let title, text;
    try {
      const body = await request.json();
      title = String(body.title || '').slice(0, 200);
      text = String(body.body || '').slice(0, 10000);
    } catch (e) {
      return new Response('Bad request', { status: 400, headers: cors() });
    }
    if (!title.trim() && !text.trim()) {
      return new Response('Empty', { status: 400, headers: cors() });
    }
    const gh = await fetch(ISSUE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'silownia-feedback-worker',
        'Authorization': 'Bearer ' + env.GITHUB_TOKEN
      },
      body: JSON.stringify({ title: title || 'Uwaga z aplikacji', body: text })
    });
    const ghText = await gh.text();
    if (!gh.ok) {
      return new Response(ghText, { status: gh.status, headers: cors() });
    }
    let number = null;
    try { number = JSON.parse(ghText).number; } catch (e) {}
    return new Response(JSON.stringify({ ok: true, number: number }), {
      status: 201,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors())
    });
  }
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
