import { useEffect } from 'react';
import { site } from '../lib/site';

// Finds a head tag, or adds it when the page was not pre-rendered (local dev)
function headTag(tag, key, value) {
  let el = document.head.querySelector(`${tag}[${key}="${value}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Sets the tab title, search description, canonical link and share tags for the open page.
 * The build writes the same tags into each pre-rendered page (src/prerender.jsx); this keeps them right
 * when visitors move between pages in the browser. The canonical link points at `path`,
 * or at the current address when no path is given.
 */
export default function usePageMeta(title, description, path) {
  useEffect(() => {
    const url = site.url + (path || window.location.pathname);
    document.title = title;
    headTag('meta', 'name', 'description').setAttribute('content', description);
    headTag('meta', 'property', 'og:title').setAttribute('content', title);
    headTag('meta', 'property', 'og:description').setAttribute('content', description);
    headTag('meta', 'property', 'og:url').setAttribute('content', url);
    headTag('link', 'rel', 'canonical').setAttribute('href', url);
  }, [title, description, path]);
}
