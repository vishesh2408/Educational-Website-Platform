import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { EditorView } from '@codemirror/view';

const CourseContent = lazy(() => import('./CourseContent'));
const EditorPanel = lazy(() => import('./CourseEditorEditorPanel'));

// CodeMirror-based HTML editor with live preview. Uses CodeMirror 6 via
// @uiw/react-codemirror and the HTML language package for basic highlighting.
export default function CourseEditor({ initial = '', onChange }) {
  const [value, setValue] = useState(initial);
  const [autoFormatOnPaste, setAutoFormatOnPaste] = useState(true);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  function handleEdit(next) {
    setValue(next);
    if (onChange) onChange(next);
  }

  // Simple HTML pretty-printer to produce indented HTML similar to VS Code's
  // default formatting (works well for typical content). It intentionally
  // preserves whitespace inside <pre>, <code>, and <textarea>.
  function formatHtml(input) {
    // Prefer Prettier in the browser for VS Code-like formatting. Fall back
    // to js-beautify if Prettier isn't available, then to a simple DOM serializer.
    try {
      const prettier = require('prettier/standalone');
      const parserHtml = require('prettier/parser-html');
      if (prettier && parserHtml) {
        return prettier.format(input || '', {
          parser: 'html',
          plugins: [parserHtml],
          tabWidth: 2,
          useTabs: false,
          htmlWhitespaceSensitivity: 'css',
          endOfLine: 'lf'
        });
      }
    } catch (e) {
      // Prettier not available in this environment; try js-beautify next
    }

    try {
      const beautify = require('js-beautify').html;
      if (beautify) {
        return beautify(input || '', {
          indent_size: 2,
          indent_char: ' ',
          preserve_newlines: true,
          max_preserve_newlines: 2,
          wrap_line_length: 0,
          end_with_newline: true
        });
      }
    } catch (e) {
      // fall back to DOM-based serialization below
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input || '', 'text/html');
      const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

      function serialize(node, depth = 0) {
        const indent = '  '.repeat(depth);
        if (!node) return '';
        if (node.nodeType === Node.TEXT_NODE) {
          const parentTag = node.parentNode && node.parentNode.tagName ? node.parentNode.tagName.toLowerCase() : '';
          if (['pre','code','textarea'].includes(parentTag)) return node.nodeValue || '';
          return (node.nodeValue || '').replace(/\s+/g, ' ').trim();
        }
        if (node.nodeType === Node.COMMENT_NODE) {
          return indent + '<!--' + (node.nodeValue || '') + '-->\n';
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        const tag = node.tagName.toLowerCase();
        const attrs = Array.from(node.attributes || []).map(a => `${a.name}="${a.value}"`).join(' ');
        const open = attrs ? `<${tag} ${attrs}>` : `<${tag}>`;
        const children = Array.from(node.childNodes || []);
        if (voidTags.has(tag)) {
          return indent + open + '\n';
        }
        if (children.length === 0) {
          return indent + open + `</${tag}>` + '\n';
        }
        if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
          const text = serialize(children[0], 0);
          return indent + open + (text ? text : '') + `</${tag}>` + '\n';
        }
        let out = indent + open + '\n';
        for (const child of children) {
          out += serialize(child, depth + 1);
        }
        out += indent + `</${tag}>` + '\n';
        return out;
      }

      const body = doc.body || doc.documentElement;
      const resultParts = [];
      body.childNodes.forEach(n => resultParts.push(serialize(n, 0)));
      let result = resultParts.join('').replace(/\s+$/,'\n');
      return result;
    } catch (e) {
      console.warn('formatHtml failed', e);
      return input;
    }
  }

  const handleFormatClick = () => {
    try {
      const formatted = formatHtml(value || '');
      setValue(formatted);
      if (onChange) onChange(formatted);
    } catch (e) {
      console.error('Format failed', e);
    }
  };

  // DOM paste handler: convert HTML clipboard data to plaintext while
  // preserving block-level elements as newlines so pasted HTML keeps line breaks.
  const pasteHandler = useMemo(() => EditorView.domEventHandlers({
    paste: (event, view) => {
      try {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;
        // Prefer plain text from clipboard if available (it usually preserves
        // newlines). If HTML exists and plain text is empty, convert HTML to
        // a plain-text representation that inserts newlines for block tags.
        let text = clipboard.getData('text/plain') || '';
        const htmlData = clipboard.getData('text/html') || '';

        // helper: walk DOM and convert to text while preserving block breaks
        const domToText = (node) => {
          if (!node) return '';
          const nodeType = node.nodeType;
          // TEXT_NODE
          if (nodeType === Node.TEXT_NODE) return node.nodeValue || '';
          if (nodeType !== Node.ELEMENT_NODE) return '';
          const tag = node.tagName.toLowerCase();
          // preserve pre/code as-is (they may contain meaningful newlines)
          if (tag === 'pre' || tag === 'code' || tag === 'textarea') return node.textContent || '';
          if (tag === 'br') return '\n';
          const isBlock = ['p','div','li','h1','h2','h3','h4','h5','h6','tr','table','thead','tbody','tfoot','ul','ol','section','article','header','footer','aside','blockquote'].includes(tag);
          let parts = [];
          node.childNodes.forEach(child => parts.push(domToText(child)));
          let joined = parts.join('');
          if (isBlock) {
            // Ensure a single trailing newline for blocks
            if (!joined.endsWith('\n')) joined = joined + '\n';
            // Leading/trailing spaces/newlines can be noisy; normalize a bit
            joined = joined.replace(/\n{3,}/g, '\n\n');
          }
          return joined;
        };

        // If the plain-text looks like HTML (many editors put HTML into
        // text/plain) we should parse it as HTML as well. This handles
        // cases where `text/plain` contains tags like `<p>...</p>` on one line.
        const looksLikeHtml = text && /<[^>]+>/.test(text);
        if ((htmlData && (!text || text.trim() === '')) || (!htmlData && looksLikeHtml)) {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlData || text, 'text/html');
            // First try a DOM-to-text conversion that preserves block newlines
            text = domToText(doc.body || doc.documentElement) || '';
            // If result still looks like a single line or is empty, fall back
            // to placing each top-level element's outerHTML on its own line
            if (!text || (typeof text === 'string' && !text.includes('\n'))) {
              try {
                const nodes = Array.from((doc.body || doc.documentElement).childNodes || []);
                const parts = nodes.map(n => {
                  if (n.nodeType === Node.ELEMENT_NODE) return n.outerHTML;
                  if (n.nodeType === Node.TEXT_NODE) return n.nodeValue || '';
                  return '';
                }).filter(Boolean);
                if (parts.length > 0) text = parts.join('\n');
              } catch (e) {
                // ignore fallback error
              }
            }
            // Trim a single trailing newline inserted by the conversion
            if (text.endsWith('\n')) text = text.replace(/\n+$/,'\n');
          } catch (e) {
            // fallback to any plain text available
            text = clipboard.getData('text/plain') || '';
          }
        }

        // If we have text, prevent default paste and insert at selection
        if (text) {
          event.preventDefault();
          const { state } = view;
          const { from, to } = state.selection.main;
          view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length }
          });

          try {
            // After inserting, get complete doc text and optionally format it
            // so pasted HTML that arrived as one line becomes pretty-printed.
            const afterInsert = view.state.doc.toString();
            if (autoFormatOnPaste) {
              const formatted = formatHtml(afterInsert || '');
              if (formatted && formatted !== afterInsert) {
                // Replace entire document with formatted content
                view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: formatted } });
                // Keep React state in sync
                handleEdit(formatted);
              } else {
                handleEdit(afterInsert);
              }
            } else {
              handleEdit(afterInsert);
            }
          } catch (e) {
            // If formatting fails, at least sync React state
            try { handleEdit(view.state.doc.toString()); } catch (_) { /* ignore */ }
          }

          return true;
        }
      } catch (e) {
        // fallback to default behavior
        console.error('Paste handler error', e);
        return false;
      }
      return false;
    }
  }), [autoFormatOnPaste, handleEdit]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">HTML source</label>
        <div className="flex items-center gap-4 mb-2">
          <button type="button" className="admin-button-secondary" onClick={handleFormatClick}>Format</button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoFormatOnPaste} onChange={(e) => setAutoFormatOnPaste(e.target.checked)} />
            <span>Auto-format on paste</span>
          </label>
        </div>
        <Suspense fallback={<div className="p-4">Loading editor…</div>}>
          <EditorPanel
            value={value}
            onChange={(val) => handleEdit(val)}
            autoFormatOnPaste={autoFormatOnPaste}
            setAutoFormatOnPaste={setAutoFormatOnPaste}
            handleFormatClick={handleFormatClick}
          />
        </Suspense>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Preview</label>
        <div className="scroll-snap-card preview-panel border rounded p-0 bg-white dark:bg-slate-800">
          <div className="slide" style={{ padding: '1rem' }}>
            <Suspense fallback={<div>Loading preview…</div>}>
              <CourseContent html={value} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
