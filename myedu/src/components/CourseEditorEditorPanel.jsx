import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';

// This component is intentionally isolated so bundlers can split
// CodeMirror and related packages into a separate chunk.
export default function CourseEditorEditorPanel({ value, onChange, autoFormatOnPaste, setAutoFormatOnPaste, handleFormatClick }) {
  // Memoize paste handler to avoid recreating on every render
  const pasteHandler = useMemo(() => EditorView.domEventHandlers({
    paste: (event, view) => {
      try {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;
        let text = clipboard.getData('text/plain') || '';
        const htmlData = clipboard.getData('text/html') || '';

        const domToText = (node) => {
          if (!node) return '';
          const nodeType = node.nodeType;
          if (nodeType === Node.TEXT_NODE) return node.nodeValue || '';
          if (nodeType !== Node.ELEMENT_NODE) return '';
          const tag = node.tagName.toLowerCase();
          if (tag === 'pre' || tag === 'code' || tag === 'textarea') return node.textContent || '';
          if (tag === 'br') return '\n';
          const isBlock = ['p','div','li','h1','h2','h3','h4','h5','h6','tr','table','thead','tbody','tfoot','ul','ol','section','article','header','footer','aside','blockquote'].includes(tag);
          let parts = [];
          node.childNodes.forEach(child => parts.push(domToText(child)));
          let joined = parts.join('');
          if (isBlock) {
            if (!joined.endsWith('\n')) joined = joined + '\n';
            joined = joined.replace(/\n{3,}/g, '\n\n');
          }
          return joined;
        };

        const looksLikeHtml = text && /<[^>]+>/.test(text);
        if ((htmlData && (!text || text.trim() === '')) || (!htmlData && looksLikeHtml)) {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlData || text, 'text/html');
            text = domToText(doc.body || doc.documentElement) || '';
            if (!text || (typeof text === 'string' && !text.includes('\n'))) {
              try {
                const nodes = Array.from((doc.body || doc.documentElement).childNodes || []);
                const parts = nodes.map(n => {
                  if (n.nodeType === Node.ELEMENT_NODE) return n.outerHTML;
                  if (n.nodeType === Node.TEXT_NODE) return n.nodeValue || '';
                  return '';
                }).filter(Boolean);
                if (parts.length > 0) text = parts.join('\n');
              } catch (e) {}
            }
            if (text.endsWith('\n')) text = text.replace(/\n+$/,'\n');
          } catch (e) {
            text = clipboard.getData('text/plain') || '';
          }
        }

        if (text) {
          event.preventDefault();
          const { state } = view;
          const { from, to } = state.selection.main;
          view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
          try {
            const afterInsert = view.state.doc.toString();
            if (autoFormatOnPaste) {
              // Formatting is handled by parent; call onChange with raw text and parent may format
              if (onChange) onChange(afterInsert);
            } else {
              if (onChange) onChange(afterInsert);
            }
          } catch (e) { try { if (onChange) onChange(view.state.doc.toString()); } catch (_) {} }
          return true;
        }
      } catch (e) {
        console.error('Paste handler error', e);
        return false;
      }
      return false;
    }
  }), [autoFormatOnPaste, onChange]);

  return (
    <div>
      <div className="scroll-snap-card editor-panel border rounded">
        <div className="slide">
          <CodeMirror
            value={value}
            height="100%"
            extensions={[html(), pasteHandler]}
            onChange={(val) => onChange && onChange(val)}
          />
        </div>
      </div>
    </div>
  );
}
