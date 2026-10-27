import { StrictMode } from 'react';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { PAGES } from './routes';
import { site } from './lib/site';

// Runs at build time (vite-prerender-plugin): turns each page into finished HTML, with its own title,
// description, canonical link and share tags, so search engines and AI crawlers read it without JavaScript.
//
// Pages are requested as "/<path>.html" so the output is flat files, dist/<path>.html, served by nginx with:
//   try_files $uri $uri.html /spa.html;
// spa.html is an empty page for addresses that aren't pre-rendered (such as the /pricing shortcut):
// React draws those in the browser, and their redirects run there.
const fileFor = (path) => (path === '/' ? '/' : `${path}.html`);

export async function prerender({ url }) {
  if (url === '/spa.html') return { html: '' };

  // Server-only, so loaded here rather than imported at the top. The edge build, because the browser
  // build leaves a MessagePort open that stops the build from ever exiting.
  const { renderToString } = await import('react-dom/server.edge');

  const path = url === '/' ? '/' : url.replace(/\.html$/, '');
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={path}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );

  const page = PAGES.find(p => p.path === path);
  if (!page) return { html };

  const pageUrl = site.url + path;
  return {
    html,
    // Every page in the list gets built, whether or not another page links to it
    links: new Set(PAGES.map(p => fileFor(p.path))),
    head: {
      lang: page.lang,
      title: page.title,
      elements: new Set([
        { type: 'meta', props: { name: 'description', content: page.description } },
        { type: 'link', props: { rel: 'canonical', href: pageUrl } },
        { type: 'meta', props: { property: 'og:url', content: pageUrl } },
        { type: 'meta', props: { property: 'og:title', content: page.title } },
        { type: 'meta', props: { property: 'og:description', content: page.description } },
        { type: 'meta', props: { name: 'twitter:title', content: page.title } },
        { type: 'meta', props: { name: 'twitter:description', content: page.description } },
      ]),
    },
  };
}
