/* src/components/RichTextEditor.jsx */
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { CharacterCount } from '@tiptap/extension-character-count';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Extension, Node, mergeAttributes } from '@tiptap/core';

import { common, createLowlight } from 'lowlight';
import jsBeautify from 'js-beautify';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/atom-one-dark.css';

import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Palette,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Code2,
  Link as LinkIcon,
  Table as TableIcon,
  Image as ImageIcon,
  Upload,
  Type,
  Maximize2,
  Sigma,
  Sparkles,
  ChevronDown
} from 'lucide-react';

import './RichTextEditor.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const lowlight = createLowlight(common);

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize?.replace(/['"]+/g, '') || null,
          renderHTML: attributes => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

// Custom Background/Highlight Color Extension (via textStyle Span attribute)
const TextBackground = Extension.create({
  name: 'textBackground',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        backgroundColor: {
          default: null,
          parseHTML: element => element.style.backgroundColor || null,
          renderHTML: attributes => {
            if (!attributes.backgroundColor) return {};
            return { style: `background-color: ${attributes.backgroundColor}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setTextBackground: backgroundColor => ({ chain }) => {
        return chain().setMark('textStyle', { backgroundColor }).run();
      },
      unsetTextBackground: () => ({ chain }) => {
        return chain().setMark('textStyle', { backgroundColor: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

// React component representing the LaTeX equation in the editor
const MathComponent = ({ node, updateAttributes, selected }) => {
  const [latexVal, setLatexVal] = useState(node.attrs.latex || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLatexVal(node.attrs.latex || '');
  }, [node.attrs.latex]);

  const renderMathHTML = () => {
    try {
      return katex.renderToString(latexVal || '\\text{Empty Equation}', {
        throwOnError: false,
        displayMode: true,
      });
    } catch (e) {
      return `<span style="color: red">${e.message}</span>`;
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateAttributes({ latex: latexVal });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  return (
    <NodeViewWrapper className={`math-node-wrapper ${selected || isEditing ? 'is-selected' : ''}`}>
      <div 
        style={{ 
          border: '1px dashed var(--color-border)', 
          borderRadius: '8px', 
          padding: '12px', 
          background: 'rgba(20, 184, 166, 0.03)',
          margin: '10px 0'
        }}
      >
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sigma size={12} />
              LaTeX Equation Editor (Press Enter to finish)
            </div>
            <input
              type="text"
              className="math-node-input"
              value={latexVal}
              onChange={(e) => setLatexVal(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-card-bg)',
                color: 'var(--color-text)',
              }}
            />
          </div>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            dangerouslySetInnerHTML={{ __html: renderMathHTML() }} 
            title="Click to edit equation"
            style={{ 
              cursor: 'pointer', 
              textAlign: 'center', 
              minHeight: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflowX: 'auto',
              padding: '4px'
            }} 
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

// Custom LaTeX Math Node Extension
const MathNode = Node.create({
  name: 'mathNode',
  group: 'block',
  content: '',
  atom: true,
  addAttributes() {
    return {
      latex: {
        default: 'f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx',
      },
    };
  },
  parseHTML() {
    return [{ tag: 'math-block' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['math-block', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },
});

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
  const absoluteUrl = data.url.startsWith('http') ? data.url : `${BASE_URL}${data.url}`;
  return { url: absoluteUrl, originalName: data.originalName || file.name };
}

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing here...' }) {
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        codeBlock: false, // Disabling default codeBlock to use CodeBlockLowlight
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-teal-600 underline hover:text-teal-700 font-medium',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Subscript,
      Superscript,
      CharacterCount,
      FontSize,
      TextBackground,
      MathNode,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync value from props to editor state (only if they differ)
  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.getHTML();
    const targetHTML = value || '';
    if (currentHTML !== targetHTML && targetHTML !== '<p></p>') {
      editor.commands.setContent(targetHTML, false);
    }
  }, [value, editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL:', previousUrl || 'https://');

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImageFromUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleImageUpload = useCallback(async (e) => {
    if (!editor) return;
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;

    try {
      const { url } = await uploadToServer(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      alert(err.message || 'Image upload failed');
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addMathBlock = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent({ type: 'mathNode', attrs: { latex: 'E = mc^2' } }).run();
  }, [editor]);

  // CodeBlock formatting logic
  const formatCodeBlock = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const { selection } = state;
    
    let codeBlockNode = null;
    let codeBlockPos = -1;

    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (node.type.name === 'codeBlock') {
        codeBlockNode = node;
        codeBlockPos = pos;
        return false;
      }
    });

    if (codeBlockNode && codeBlockPos !== -1) {
      const codeText = codeBlockNode.textContent || '';
      let formattedText = codeText;
      const lang = codeBlockNode.attrs.language || 'javascript';
      
      try {
        if (lang === 'html') {
          formattedText = jsBeautify.html(codeText, { indent_size: 2 });
        } else if (lang === 'css') {
          formattedText = jsBeautify.css(codeText, { indent_size: 2 });
        } else {
          formattedText = jsBeautify.js(codeText, { indent_size: 2 });
        }
      } catch (err) {
        console.warn('Formatting failed', err);
      }

      editor.chain().focus().command(({ tr }) => {
        const start = codeBlockPos + 1;
        const end = start + codeText.length;
        tr.replaceWith(start, end, state.schema.text(formattedText));
        return true;
      }).run();
    } else {
      alert('Place your cursor inside a code block to format it.');
    }
  }, [editor]);

  if (!editor) {
    return <div className="text-sm p-4 border rounded animate-pulse">Loading editor...</div>;
  }

  const getTypographyValue = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    return 'p';
  };

  const handleTypographyChange = (e) => {
    const val = e.target.value;
    if (val === 'p') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(val.replace('h', ''), 10);
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  // Get current font size applied
  const getFontSizeValue = () => {
    return editor.getAttributes('textStyle').fontSize || '16px';
  };

  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    if (size === 'default') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(size).run();
    }
  };

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="rich-text-editor__toolbar">
        {/* Undo/Redo */}
        <div className="rich-text-editor__group">
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo2 />
          </button>
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo2 />
          </button>
        </div>

        {/* Typography & Font Sizes */}
        <div className="rich-text-editor__group">
          <select
            className="rich-text-editor__select"
            value={getTypographyValue()}
            onChange={handleTypographyChange}
            title="Typography"
            style={{ marginRight: '4px' }}
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>

          <select
            className="rich-text-editor__select"
            value={getFontSizeValue()}
            onChange={handleFontSizeChange}
            title="Font Size"
          >
            <option value="default">Size (Default)</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="30px">30px</option>
            <option value="36px">36px</option>
          </select>
        </div>

        {/* Text Styles */}
        <div className="rich-text-editor__group">
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('underline') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline"
          >
            <UnderlineIcon />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('strike') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('code') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline Code"
          >
            <Code />
          </button>
        </div>

        {/* Colors & Background */}
        <div className="rich-text-editor__group">
          <div className="rich-text-editor__color-picker" title="Text Color">
            <Palette />
            <input
              type="color"
              className="rich-text-editor__color-input"
              value={editor.getAttributes('textStyle').color || '#000000'}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
          </div>
          <div className="rich-text-editor__color-picker" title="Background Color">
            <Highlighter />
            <input
              type="color"
              className="rich-text-editor__color-input"
              value={editor.getAttributes('textStyle').backgroundColor || '#ffffff'}
              onChange={(e) => editor.chain().focus().setTextBackground(e.target.value).run()}
            />
          </div>
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              editor.chain().focus().unsetTextBackground().run();
            }}
            title="Clear Colors"
          >
            <Type />
          </button>
        </div>

        {/* Alignment */}
        <div className="rich-text-editor__group">
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Align Left"
          >
            <AlignLeft />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Align Center"
          >
            <AlignCenter />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Align Right"
          >
            <AlignRight />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Align Justify"
          >
            <AlignJustify />
          </button>
        </div>

        {/* Lists */}
        <div className="rich-text-editor__group">
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('taskList') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Task List"
          >
            <CheckSquare />
          </button>
        </div>

        {/* Extra Blocks */}
        <div className="rich-text-editor__group">
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            <Quote />
          </button>
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Line"
          >
            <Minus />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          >
            <Code2 />
          </button>
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={formatCodeBlock}
            title="Format Code Block"
          >
            <Sparkles size={16} />
          </button>
        </div>

        {/* Math, Link, Image & Tables */}
        <div className="rich-text-editor__group">
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={addMathBlock}
            title="Insert LaTeX Math"
          >
            <Sigma />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('link') ? 'is-active' : ''}`}
            onClick={addLink}
            title="Insert Link"
          >
            <LinkIcon />
          </button>
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={addImageFromUrl}
            title="Image from URL"
          >
            <ImageIcon />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            title="Upload Image"
          >
            <Upload />
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn ${editor.isActive('table') ? 'is-active' : ''}`}
            onClick={addTable}
            title="Insert Table"
          >
            <TableIcon />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="rich-text-editor__content">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="rich-text-editor__statusbar">
        <span>Characters: {editor.storage.characterCount?.characters?.() || 0}</span>
        <span>Words: {editor.storage.characterCount?.words?.() || 0}</span>
      </div>
    </div>
  );
}
