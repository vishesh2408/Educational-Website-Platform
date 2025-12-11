import React, { useEffect } from 'react';
import DOMPurify from 'dompurify';
// import Prism from 'prismjs';
// import 'prismjs/themes/prism-tomorrow.css';
import MarkdownIt from 'markdown-it';

// Renderer for course content (markdown or HTML). It converts markdown to HTML,
// sanitizes it, and renders inside `.course-content` wrapper so scoped global
// styles apply. Prism highlights code blocks.
const md = new MarkdownIt({ html: true, breaks: true, linkify: true });

// Simple slug generator for headings to support sidebar TOC links.
const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export default function CourseContent({ html }) {
  const sanitized = React.useMemo(() => {
    if (!html) return '';
    // Convert markdown to HTML first
    const markdown = md.render(html);
    // Run DOMPurify to strip scripts and dangerous attributes
    const base = DOMPurify.sanitize(markdown);
    // Then parse and rewrite any external image src to go through our proxy
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(base, 'text/html');
      // Remove any <iframe> elements entirely for extra safety
      doc.querySelectorAll('iframe').forEach(n => n.remove());
      // Add IDs and toc data attributes to headings for sidebar linking
      doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
        const existingId = h.getAttribute('id');
        const slug = existingId || slugify(h.textContent || '');
        if (slug) {
          h.setAttribute('id', slug);
          if (!h.getAttribute('data-toc-id')) {
            h.setAttribute('data-toc-id', slug);
          }
          h.classList.add('toc-heading');
        }
      });
      // Tag code blocks for special styling
      doc.querySelectorAll('pre').forEach((pre) => pre.classList.add('code-panel'));
      // Light structure class on divs to keep consistent spacing
      doc.querySelectorAll('div').forEach((div) => {
        if (!div.classList.length) div.classList.add('content-block');
      });
      doc.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') || '';
        if (!src.startsWith('/') && !src.startsWith(location.origin) && !src.startsWith('/api/admin/util/proxy')) {
          try {
            img.setAttribute('src', '/api/admin/util/proxy?url=' + encodeURIComponent(src));
          } catch (e) {
            img.removeAttribute('src');
          }
        }
      });
      return doc.body.innerHTML;
    } catch (e) {
      return base;
    }
  }, [html]);

  useEffect(() => {
    // Highlight after render. Prism looks for <pre><code class="language-..."> blocks.
    try {
      // Prism.highlightAll();
    } catch (e) {
      // non-fatal
    }
  }, [sanitized]);

  return (
    <div className="course-content" dangerouslySetInnerHTML={{ __html: sanitized }} />
  );
}
