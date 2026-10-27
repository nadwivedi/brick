import { useEffect } from 'react';
import { site } from '../lib/site';

/**
 * Sets the tab title and search description while a page is open,
 * then puts the site-wide ones from index.html back when it closes.
 * The canonical link points at `path`, or at the current address when no path is given.
 */
export default function usePageMeta(title, description, path) {
  useEffect(() => {
    const desc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const prev = { title: document.title, desc: desc?.content, ogTitle: ogTitle?.content };

    document.title = title;
    desc?.setAttribute('content', description);
    ogTitle?.setAttribute('content', title);

    // index.html carries the homepage canonical; point it at this page while it is open
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.href;
    canonical?.setAttribute('href', site.url + (path || window.location.pathname));

    return () => {
      if (canonical) canonical.href = prevCanonical;
      document.title = prev.title;
      if (desc) desc.content = prev.desc;
      if (ogTitle) ogTitle.content = prev.ogTitle;
    };
  }, [title, description, path]);
}
