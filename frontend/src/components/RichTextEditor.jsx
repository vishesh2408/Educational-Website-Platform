/* src/components/RichTextEditor.jsx */
import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
  Baseline,
  ChevronDown
} from 'lucide-react';

import './RichTextEditor.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

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
          class: 'text-teal-600 underline hover:text-teal-700',
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
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only call onChange if it has actually changed to prevent cursor jumps
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync value from props to editor state (only if they differ)
  React.useEffect(() => {
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

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
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
    e.target.value = ''; // Reset input
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

  if (!editor) {
    return <div className="text-sm p-4 border rounded animate-pulse">Loading editor...</div>;
  }

  // Helper to determine the current typography option
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

        {/* Typography */}
        <div className="rich-text-editor__group">
          <select
            className="rich-text-editor__select"
            value={getTypographyValue()}
            onChange={handleTypographyChange}
            title="Typography"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
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

        {/* Colors */}
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
          <div className="rich-text-editor__color-picker" title="Highlight Color">
            <Highlighter />
            <input
              type="color"
              className="rich-text-editor__color-input"
              value={editor.getAttributes('highlight').color || '#ffff00'}
              onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
            />
          </div>
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              editor.chain().focus().unsetHighlight().run();
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
        </div>

        {/* Link / Image / Table */}
        <div className="rich-text-editor__group">
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
