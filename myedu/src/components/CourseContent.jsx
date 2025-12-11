import React from 'react';
import MarkdownIt from 'markdown-it';
import markdownItHighlight from 'markdown-it-highlightjs';
import 'highlight.js/styles/atom-one-dark.css';

// Renderer for course content (markdown or HTML). It converts markdown to HTML,
// sanitizes it, and renders inside `.course-content` wrapper so scoped global
// styles apply. Code blocks are highlighted using Highlight.js.
const md = new MarkdownIt({ html: true, breaks: true, linkify: true });
md.use(markdownItHighlight);

// Simple HTML sanitizer to remove dangerous scripts and attributes
const sanitizeHTML = (html) => {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handlers (on* attributes)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  // Remove iframe, embed, object tags
  sanitized = sanitized.replace(/<(iframe|embed|object|form|input|button)\b[^>]*>/gi, '');
  return sanitized;
};

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
    // Sanitize to strip scripts and dangerous attributes
    const base = sanitizeHTML(markdown);
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

  // Code highlighting is handled by markdown-it-highlightjs plugin during rendering
  return (
    <div className="course-content" dangerouslySetInnerHTML={{ __html: sanitized }} />
  );
}
