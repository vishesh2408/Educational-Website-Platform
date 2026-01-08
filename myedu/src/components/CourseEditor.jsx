import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';

const CourseContent = lazy(() => import('./CourseContent'));
const EditorPanel = lazy(() => import('./CourseEditorEditorPanel'));

// CodeMirror-based HTML editor with live preview. Uses CodeMirror 6 via
// @uiw/react-codemirror and the HTML language package for basic highlighting.
export default function CourseEditor({ initial = '', onChange }) {
  const [value, setValue] = useState(initial);
  const AUTO_FORMAT_ON_PASTE = true;
  const ignoreNextChangeRef = useRef(false);

  useEffect(() => {
    // If HTML arrives as a single long line (common when pasted/saved),
    // format it once so it's readable in the source editor.
    try {
      const next = initial || '';
      const looksLikeHtml = /<[^>]+>/.test(next);
      if (looksLikeHtml && next && !next.includes('\n')) {
        setValue(formatHtml(next));
      } else {
        setValue(next);
      }
    } catch (_) {
      setValue(initial);
    }
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">HTML source</label>
        <div className="flex items-center gap-4 mb-2">
          <button type="button" className="admin-button-secondary" onClick={handleFormatClick}>Format</button>
          <span className="text-sm text-gray-500">Pasted HTML auto-formats</span>
        </div>
        <Suspense fallback={<div className="p-4">Loading editor…</div>}>
          <EditorPanel
            value={value}
            onChange={(val) => {
              if (ignoreNextChangeRef.current) {
                ignoreNextChangeRef.current = false;
                return;
              }
              handleEdit(val);
            }}
            onPaste={(afterInsert) => {
              if (!AUTO_FORMAT_ON_PASTE) return handleEdit(afterInsert);
              try {
                const formatted = formatHtml(afterInsert || '');
                // Prevent the raw "afterInsert" onChange from winning.
                ignoreNextChangeRef.current = true;
                handleEdit(formatted);
              } catch (_) {
                ignoreNextChangeRef.current = true;
                handleEdit(afterInsert);
              }
            }}
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
