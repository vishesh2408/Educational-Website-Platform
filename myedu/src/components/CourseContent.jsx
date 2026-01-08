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
    const raw = String(html);

    const normalizeLooseMarkdown = (source) => {
      const lines = String(source || '').replace(/\r\n/g, '\n').split('\n');
      const out = [];
      let inFence = false;
      let promotedBoldLines = 0;

      for (let line of lines) {
        const trimmed = line.trim();

        if (/^```/.test(trimmed)) {
          inFence = !inFence;
          out.push(line);
          continue;
        }
        if (inFence) {
          out.push(line);
          continue;
        }

        // Promote standalone bold lines into headings (common when users wrap markdown in <strong>)
        const boldOnly = trimmed.match(/^\*\*(.+?)\*\*$/);
        if (boldOnly) {
          promotedBoldLines += 1;
          const title = (boldOnly[1] || '').trim();
          const prefix = promotedBoldLines === 1 ? '# ' : promotedBoldLines === 2 ? '## ' : '### ';
          out.push(prefix + title);
          out.push('');
          continue;
        }

        // If a paragraph contains an HR marker and then a heading in the same line: `--- ### Title`
        // turn it into proper markdown blocks.
        line = line.replace(/\s*---\s*#{1,6}\s+/g, '\n\n---\n\n### ');

        // Ensure headings begin on their own line: `... text ### Heading` -> split
        line = line.replace(/([^\n])\s+(#{1,6}\s+)/g, '$1\n\n$2');

        // Break bullets/items when they are inline: `... * **Item** ...`
        line = line.replace(/\s\*\s+(?=\*\*)/g, '\n* ');

        // Break numbered items when they are inline: `... 1. **Item** ...`
        line = line.replace(/\s(\d{1,2}\.\s+(?=\*\*))/g, '\n$1');

        // If we have a heading line that also contains trailing paragraph text, split it.
        // Example: `### **Title** some text` -> heading then paragraph.
        const maybeHeading = line.match(/^(#{1,6}\s+)(\*\*.+?\*\*)(\s+.+)$/);
        if (maybeHeading) {
          out.push((maybeHeading[1] || '') + (maybeHeading[2] || ''));
          out.push('');
          out.push((maybeHeading[3] || '').trim());
          continue;
        }

        out.push(line);
      }

      return out
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };

    // If stored content is HTML but contains markdown markers in text nodes,
    // MarkdownIt will not parse markdown inside raw HTML blocks. In that case,
    // extract readable text with line breaks and run MarkdownIt on that.
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
    const looksLikeMarkdown = /(^|\n)\s{0,3}#{1,6}\s+|\*\*[^\n*]+\*\*|__[^\n_]+__|(^|\n)\s*[-*+]\s+|(^|\n)\s*\d+\.\s+/m.test(raw);

    const htmlToText = (sourceHtml) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(sourceHtml || '', 'text/html');
        const root = doc.body || doc.documentElement;
        const walk = (node) => {
          if (!node) return '';
          if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
          if (node.nodeType !== Node.ELEMENT_NODE) return '';
          const tag = (node.tagName || '').toLowerCase();
          if (tag === 'br') return '\n';
          if (tag === 'pre' || tag === 'code' || tag === 'textarea') return node.textContent || '';
          const isBlock = ['p','div','li','h1','h2','h3','h4','h5','h6','tr','table','thead','tbody','tfoot','ul','ol','section','article','header','footer','aside','blockquote'].includes(tag);
          let out = '';
          node.childNodes.forEach((child) => {
            out += walk(child);
          });
          if (isBlock) {
            if (!out.endsWith('\n')) out += '\n';
          }
          return out;
        };
        const text = walk(root)
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        return text;
      } catch (e) {
        return '';
      }
    };

    const usedExtraction = looksLikeHtml && looksLikeMarkdown;
    const extractedText = usedExtraction ? (htmlToText(raw) || raw) : raw;
    const markdownSource = usedExtraction ? normalizeLooseMarkdown(extractedText) : extractedText;

    // Convert markdown to HTML first
    const markdown = md.render(markdownSource);
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
