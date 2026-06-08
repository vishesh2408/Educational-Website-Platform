import React, { useMemo, useRef, useCallback } from 'react';
import MarkdownIt from 'markdown-it';
import mdHighlight from 'markdown-it-highlightjs';
import 'highlight.js/styles/atom-one-dark.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

function buildMarkdownRenderer() {
    const md = new MarkdownIt({
        html: false,
        linkify: true,
        breaks: true,
    }).use(mdHighlight);

    const defaultFence = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const info = (token.info || '').trim();
        const lang = info ? info.split(/\s+/)[0] : '';
        const inner = defaultFence ? defaultFence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);

        // Wrap fenced code blocks in a card with a copy button.
        return `
<div class="md-code-card" data-md-code-card="1">
  <div class="md-code-card__header">
    <div class="md-code-card__lang">${md.utils.escapeHtml(lang || 'code')}</div>
    <button type="button" class="md-code-card__copy" data-md-copy-btn="1">Copy</button>
  </div>
  <div class="md-code-card__body">${inner}</div>
</div>`;
    };

    return md;
}

async function uploadToServer(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE_URL}/admin/uploads`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.msg || `Upload failed (${res.status})`);
    }
    if (!data.url) {
        throw new Error('Upload response missing url');
    }
    // data.url is a server path like /upload/notes/<file>
    const absoluteUrl = data.url.startsWith('http') ? data.url : `${BASE_URL}${data.url}`;
    return { url: absoluteUrl, originalName: data.originalName || file.name };
}

export default function MarkdownNoteEditor({ value, onChange, className = '' }) {
    const textareaRef = useRef(null);
    const imgInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const md = useMemo(() => buildMarkdownRenderer(), []);
    const html = useMemo(() => md.render(String(value || '')), [md, value]);

    const applyEdit = useCallback((mutate) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const current = String(value || '');
        const { nextValue, nextStart, nextEnd } = mutate({ current, start, end });
        onChange(nextValue);
        requestAnimationFrame(() => {
            try {
                el.focus();
                el.setSelectionRange(nextStart, nextEnd);
            } catch (_) {
                // ignore
            }
        });
    }, [onChange, value]);

    const wrapSelection = useCallback((before, after, placeholder = '') => {
        applyEdit(({ current, start, end }) => {
            const selected = current.slice(start, end);
            const useText = selected || placeholder;
            const nextValue = current.slice(0, start) + before + useText + after + current.slice(end);
            const selStart = start + before.length;
            const selEnd = selStart + useText.length;
            return { nextValue, nextStart: selStart, nextEnd: selEnd };
        });
    }, [applyEdit]);

    const insertBlock = useCallback((blockText) => {
        applyEdit(({ current, start, end }) => {
            const prefix = current.slice(0, start);
            const suffix = current.slice(end);
            const needsNewline = prefix.length > 0 && !prefix.endsWith('\n');
            const before = needsNewline ? '\n' : '';
            const after = suffix.length > 0 && !suffix.startsWith('\n') ? '\n' : '';
            const nextValue = prefix + before + blockText + after + suffix;
            const cursor = (prefix + before + blockText).length;
            return { nextValue, nextStart: cursor, nextEnd: cursor };
        });
    }, [applyEdit]);

    const onPreviewClick = useCallback((e) => {
        const btn = e.target && e.target.closest ? e.target.closest('[data-md-copy-btn="1"]') : null;
        if (!btn) return;
        const card = btn.closest('[data-md-code-card="1"]');
        const codeEl = card ? card.querySelector('pre code') : null;
        const text = codeEl ? codeEl.textContent : '';
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const prev = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(() => { btn.textContent = prev; }, 900);
        }).catch(() => {
            // ignore
        });
    }, []);

    const handleUploadImage = useCallback(async (file) => {
        const { url, originalName } = await uploadToServer(file);
        const alt = (originalName || 'image').replace(/\.[^.]+$/, '');
        insertBlock(`![${alt}](${url})`);
    }, [insertBlock]);

    const handleUploadFile = useCallback(async (file) => {
        const { url, originalName } = await uploadToServer(file);
        const label = originalName || 'file';
        insertBlock(`[${label}](${url})`);
    }, [insertBlock]);

    return (
        <div className={`md-note-editor ${className}`}>
            <div className="md-note-editor__toolbar">
                <button type="button" className="admin-button-secondary" onClick={() => wrapSelection('**', '**', 'bold')}>Bold</button>
                <button type="button" className="admin-button-secondary" onClick={() => wrapSelection('*', '*', 'italic')}>Italic</button>
                <button type="button" className="admin-button-secondary" onClick={() => wrapSelection('~~', '~~', 'strike')}>Strike</button>
                <button type="button" className="admin-button-secondary" onClick={() => wrapSelection('`', '`', 'code')}>Inline Code</button>
                <button type="button" className="admin-button-secondary" onClick={() => insertBlock('# Heading')}>H1</button>
                <button type="button" className="admin-button-secondary" onClick={() => insertBlock('## Heading')}>H2</button>
                <button type="button" className="admin-button-secondary" onClick={() => insertBlock('- item')}>List</button>
                <button type="button" className="admin-button-secondary" onClick={() => insertBlock('1. item')}>Ordered</button>
                <button type="button" className="admin-button-secondary" onClick={() => insertBlock('> quote')}>Quote</button>
                <button type="button" className="admin-button-secondary" onClick={() => wrapSelection('[', '](https://)', 'link text')}>Link</button>
                <button type="button" className="admin-button-secondary" onClick={() => insertBlock('```js\n// code\n```')}>Code</button>
                <button type="button" className="admin-button-secondary" onClick={() => insertBlock('| Col 1 | Col 2 |\n| --- | --- |\n| Val 1 | Val 2 |')}>Table</button>

                <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={async (e) => {
                        const file = e.target.files && e.target.files[0];
                        e.target.value = '';
                        if (!file) return;
                        try { await handleUploadImage(file); } catch (err) { alert(err.message || 'Image upload failed'); }
                    }}
                />
                <button type="button" className="admin-button-secondary" onClick={() => imgInputRef.current && imgInputRef.current.click()}>Upload Image</button>

                <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                    onChange={async (e) => {
                        const file = e.target.files && e.target.files[0];
                        e.target.value = '';
                        if (!file) return;
                        try { await handleUploadFile(file); } catch (err) { alert(err.message || 'File upload failed'); }
                    }}
                />
                <button type="button" className="admin-button-secondary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>Upload File</button>
            </div>

            <div className="md-note-editor__grid">
                <div className="md-note-editor__pane">
                    <div className="md-note-editor__paneTitle">Markdown</div>
                    <textarea
                        ref={textareaRef}
                        className="form-input"
                        style={{ minHeight: 280, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                        value={String(value || '')}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Write in Markdown..."
                    />
                </div>
                <div className="md-note-editor__pane">
                    <div className="md-note-editor__paneTitle">Preview</div>
                    <div className="admin-note-preview md-note-editor__preview" onClick={onPreviewClick} dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            </div>

            <style>{`
                .md-note-editor__toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
                .md-note-editor__grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
                .md-note-editor__paneTitle{font-size:12px;font-weight:600;margin-bottom:6px;opacity:.8}
                .md-note-editor__preview{border:1px solid rgba(0,0,0,.08);border-radius:8px;padding:12px;min-height:280;background:rgba(255,255,255,.6)}
                .md-code-card{border:1px solid rgba(0,0,0,.10);border-radius:10px;overflow:hidden;margin:10px 0}
                .md-code-card__header{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid rgba(0,0,0,.10);font-size:12px}
                .md-code-card__lang{opacity:.8}
                .md-code-card__copy{padding:4px 8px;border-radius:8px;border:1px solid rgba(0,0,0,.14);background:transparent;cursor:pointer}
                .md-code-card__body pre{margin:0}
            `}</style>
        </div>
    );
}
