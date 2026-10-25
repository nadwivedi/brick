import { useEffect } from 'react';
import { site } from '../lib/site';

/**
 * Sets the tab title and search description while a page is open,
 * then puts the site-wide ones from index.html back when it closes.
 * Pass the page's path to also add a canonical link (only once VITE_SITE_URL is set).
 */
export default function usePageMeta(title, description, path) {
  useEffect(() => {
    const desc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const prev = { title: document.title, desc: desc?.content, ogTitle: ogTitle?.content };

    document.title = title;
    desc?.setAttribute('content', description);
    ogTitle?.setAttribute('content', title);

    let canonical = null;
    if (path && site.url) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = site.url + path;
      document.head.appendChild(canonical);
    }

    return () => {
      canonical?.remove();
      document.title = prev.title;
      if (desc) desc.content = prev.desc;
      if (ogTitle) ogTitle.content = prev.ogTitle;
    };
  }, [title, description, path]);
}
