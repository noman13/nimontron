/**
 * Cloudflare Worker for the wedding invitation.
 *
 *  - Serves the site in ./public
 *  - Personal links (?to=Noman+and+Meehan) get a personalised link-preview title,
 *    and the preview image is given the full address WhatsApp needs.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const res = await env.ASSETS.fetch(request);
    if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
    return personalise(res, url);
  },
};

const escHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function personalise(res, url) {
  const guest = (url.searchParams.get('to') || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  let rewriter = new HTMLRewriter()
    .on('meta[property="og:image"]', {
      element(el) {
        const src = el.getAttribute('content') || '';
        if (src.startsWith('/')) el.setAttribute('content', url.origin + src);
      },
    })
    .on('head', { element(el) { el.append(`<meta property="og:url" content="${escHtml(url.href)}">`, { html: true }); } });
  if (guest) {
    rewriter = rewriter.on('meta[property="og:title"]', {
      element(el) { el.setAttribute('content', `Dear ${guest} · ${el.getAttribute('content') || ''}`); },
    });
  }
  const out = rewriter.transform(res);
  const headers = new Headers(out.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(out.body, { status: out.status, statusText: out.statusText, headers });
}
