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
import BulletList from '@tiptap/extension-bullet-list';
import { Extension, Node, Mark, mergeAttributes } from '@tiptap/core';

import { common, createLowlight } from 'lowlight';
import jsBeautify from 'js-beautify';
import katex from 'katex';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer 
} from 'recharts';

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
  Sigma,
  Sparkles,
  ChevronDown,
  Smile,
  MessageSquare,
  Play,
  HelpCircle,
  Heading,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  Maximize2
} from 'lucide-react';

import './RichTextEditor.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const lowlight = createLowlight(common);

// 1. Custom Font Size Extension
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

// 2. Custom Font Family Extension
const FontFamily = Extension.create({
  name: 'fontFamily',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontFamily: {
          default: null,
          parseHTML: element => element.style.fontFamily?.replace(/['"]+/g, '') || null,
          renderHTML: attributes => {
            if (!attributes.fontFamily) return {};
            return { style: `font-family: ${attributes.fontFamily}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontFamily: fontFamily => ({ chain }) => {
        return chain().setMark('textStyle', { fontFamily }).run();
      },
      unsetFontFamily: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

// 3. Custom Line Indentation Extension (margin-left multiplier)
const Indent = Extension.create({
  name: 'indent',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minIndent: 0,
      maxIndent: 8,
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const marginLeft = element.style.marginLeft || '0px';
              return parseInt(marginLeft, 10) / 24 || 0;
            },
            renderHTML: attributes => {
              if (!attributes.indent) return {};
              return { style: `margin-left: ${attributes.indent * 24}px` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      indent: () => ({ tr, state }) => {
        const { selection } = state;
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            const nextIndent = Math.min(currentIndent + 1, this.options.maxIndent);
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: nextIndent });
          }
        });
        return true;
      },
      outdent: () => ({ tr, state }) => {
        const { selection } = state;
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            const nextIndent = Math.max(currentIndent - 1, this.options.minIndent);
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: nextIndent });
          }
        });
        return true;
      },
    };
  },
});

// 4. Custom Paragraph Spacing (LineHeight) Extension
const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return { types: ['paragraph', 'heading'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: element => element.style.lineHeight || null,
          renderHTML: attributes => {
            if (!attributes.lineHeight) return {};
            return { style: `line-height: ${attributes.lineHeight}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setLineHeight: lineHeight => ({ commands }) => {
        return this.options.types.some(type => commands.updateAttributes(type, { lineHeight }));
      },
      unsetLineHeight: () => ({ commands }) => {
        return this.options.types.some(type => commands.updateAttributes(type, { lineHeight: null }));
      },
    };
  },
});

// 5. Custom Background/Highlight Color Extension (via textStyle Span attribute)
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

// 6. Custom Paragraph Border Extension
const ParagraphBorder = Extension.create({
  name: 'paragraphBorder',
  addOptions() {
    return { types: ['paragraph'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        border: {
          default: null,
          parseHTML: element => element.style.border || null,
          renderHTML: attributes => {
            if (!attributes.border) return {};
            return { style: `border: ${attributes.border}; padding: 10px; border-radius: 6px;` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setParagraphBorder: border => ({ commands }) => {
        return this.options.types.some(type => commands.updateAttributes(type, { border }));
      },
      unsetParagraphBorder: () => ({ commands }) => {
        return this.options.types.some(type => commands.updateAttributes(type, { border: null }));
      },
    };
  },
});

// 7. Custom Bullet List Style Customization
const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      listType: {
        default: 'disc',
        parseHTML: element => element.getAttribute('data-list-type') || 'disc',
        renderHTML: attributes => {
          if (attributes.listType === 'disc') return {};
          let style = 'disc';
          if (attributes.listType === 'square') style = 'square';
          else if (attributes.listType === 'star') style = '"★ "';
          else if (attributes.listType === 'arrow') style = '"➔ "';
          return {
            'data-list-type': attributes.listType,
            style: `list-style-type: ${style}`,
          };
        },
      },
    };
  },
});

// 8. Custom Comments Inline Mark
const CommentMark = Mark.create({
  name: 'comment',
  addAttributes() {
    return {
      comment: {
        default: '',
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-comment]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-comment': HTMLAttributes.comment || '',
        class: 'editor-comment-span',
        style: 'border-bottom: 2px dashed #f59e0b; background-color: rgba(245, 158, 11, 0.1); cursor: help;',
        title: `Comment: ${HTMLAttributes.comment}`,
      }),
      0,
    ];
  },
  addCommands() {
    return {
      setComment: comment => ({ commands }) => {
        return commands.setMark(this.name, { comment });
      },
      unsetComment: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});

// 9. Custom Word Art styling Extension (Rainbow, Neon, Outline, Retro)
const WordArt = Extension.create({
  name: 'wordArt',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        wordArt: {
          default: null,
          parseHTML: element => element.getAttribute('data-wordart') || null,
          renderHTML: attributes => {
            if (!attributes.wordArt) return {};
            let style = '';
            if (attributes.wordArt === 'rainbow') {
              style = 'background: linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 1.25em; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);';
            } else if (attributes.wordArt === 'neon') {
              style = 'color: #fff; text-shadow: 0 0 5px #06b6d4, 0 0 10px #06b6d4, 0 0 15px #06b6d4; font-weight: 800; font-style: italic;';
            } else if (attributes.wordArt === 'outline') {
              style = 'color: white; -webkit-text-stroke: 1.5px #111827; font-weight: 900; font-size: 1.3em;';
            } else if (attributes.wordArt === 'retro') {
              style = 'color: #f97316; font-weight: 900; text-shadow: 2px 2px 0px #ffedd5, 4px 4px 0px #ea580c; font-style: italic;';
            }
            return {
              'data-wordart': attributes.wordArt,
              style,
            };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setWordArt: wordArt => ({ chain }) => {
        return chain().setMark('textStyle', { wordArt }).run();
      },
      unsetWordArt: () => ({ chain }) => {
        return chain().setMark('textStyle', { wordArt: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

// 10. Smart UI Card Template Node
const CardTemplate = Node.create({
  name: 'cardTemplate',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      type: {
        default: 'info',
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-card-template]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const type = node?.attrs?.type || 'info';
    let border = 'rgba(20, 184, 166, 0.4)';
    let bg = 'rgba(20, 184, 166, 0.05)';
    if (type === 'warning') {
      border = 'rgba(239, 68, 68, 0.4)';
      bg = 'rgba(239, 68, 68, 0.05)';
    } else if (type === 'tip') {
      border = 'rgba(139, 92, 246, 0.4)';
      bg = 'rgba(139, 92, 246, 0.05)';
    } else if (type === 'success') {
      border = 'rgba(34, 197, 94, 0.4)';
      bg = 'rgba(34, 197, 94, 0.05)';
    }
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-card-template': type,
        style: `border-left: 6px solid ${border}; background-color: ${bg}; padding: 16px; border-radius: 8px; margin: 16px 0;`,
      }),
      0,
    ];
  },
});

// 11. Custom LaTeX Math Block Component
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

// LaTeX Math Node
const MathNode = Node.create({
  name: 'mathNode',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      latex: {
        default: 'f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx',
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-math-block]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-math-block': true })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },
});

// 12. Custom Video Block Node
const VideoNode = Node.create({
  name: 'videoNode',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: {
        default: '',
      },
    };
  },
  parseHTML() {
    return [{ tag: 'video[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: true, style: 'max-width: 100%; border-radius: 8px; margin: 10px 0;' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes, selected }) => {
      const [srcVal, setSrcVal] = useState(node.attrs.src || '');
      const [isEditing, setIsEditing] = useState(!node.attrs.src);

      const handleUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const { url } = await uploadToServer(file);
          setSrcVal(url);
          updateAttributes({ src: url });
          setIsEditing(false);
        } catch (err) {
          alert(err.message || 'Video upload failed');
        }
      };

      return (
        <NodeViewWrapper className={`video-node-wrapper ${selected ? 'is-selected' : ''}`}>
          <div style={{ border: '1px dashed var(--color-border)', borderRadius: '8px', padding: '12px', background: 'var(--color-bg)', margin: '10px 0' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600' }}>Insert Video URL or Upload MP4</div>
                <input
                  type="text"
                  placeholder="Paste YouTube, Vimeo or MP4 URL..."
                  value={srcVal}
                  onChange={(e) => setSrcVal(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)' }}
                />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      updateAttributes({ src: srcVal });
                      setIsEditing(false);
                    }}
                    className="admin-button-primary"
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    Apply URL
                  </button>
                  <label className="admin-button-secondary" style={{ padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}>
                    Upload MP4 Video
                    <input type="file" accept="video/*" onChange={handleUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {srcVal.includes('youtube.com') || srcVal.includes('youtu.be') ? (
                  <iframe
                    src={srcVal.replace('watch?v=', 'embed/')}
                    title="YouTube Video"
                    style={{ width: '100%', aspectRatio: '16/9', borderRadius: '8px', border: 'none' }}
                    allowFullScreen
                  />
                ) : (
                  <video src={srcVal} controls style={{ width: '100%', borderRadius: '8px' }} />
                )}
                {selected && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="admin-button-secondary"
                    style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '11px', padding: '2px 8px' }}
                  >
                    Change Video
                  </button>
                )}
              </div>
            )}
          </div>
        </NodeViewWrapper>
      );
    });
  },
});

// 13. Custom Interactive Chart Node
const ChartNode = Node.create({
  name: 'chartNode',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      chartType: { default: 'bar' },
      data: { default: JSON.stringify([{ label: 'A', value: 100 }, { label: 'B', value: 200 }]) },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-chart-node]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-chart-node': true })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes, selected }) => {
      const [type, setType] = useState(node.attrs.chartType || 'bar');
      const [dataRows, setDataRows] = useState(JSON.parse(node.attrs.data || '[]'));
      const [newLabel, setNewLabel] = useState('');
      const [newValue, setNewValue] = useState('');

      const addRow = () => {
        if (!newLabel || !newValue) return;
        const updated = [...dataRows, { label: newLabel, value: Number(newValue) }];
        setDataRows(updated);
        updateAttributes({ data: JSON.stringify(updated) });
        setNewLabel('');
        setNewValue('');
      };

      const removeRow = (idx) => {
        const updated = dataRows.filter((_, i) => i !== idx);
        setDataRows(updated);
        updateAttributes({ data: JSON.stringify(updated) });
      };

      const handleTypeChange = (newType) => {
        setType(newType);
        updateAttributes({ chartType: newType });
      };

      const colors = ['#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308'];

      return (
        <NodeViewWrapper className="chart-node-container">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-primary-dark)' }}>
            Interactive Chart Component
          </div>
          {selected && (
            <div className="chart-node-input-group">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="rich-text-editor__select"
                  style={{ padding: '4px 10px' }}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>

              {/* Data list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                {dataRows.map((row, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                    <span>{row.label}: {row.value}</span>
                    <button type="button" onClick={() => removeRow(idx)} style={{ color: 'red', border: 'none', background: 'transparent', cursor: 'pointer' }}>Delete</button>
                  </div>
                ))}
              </div>

              {/* Add data row */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Label..."
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  style={{ width: '40%', padding: '4px 8px', fontSize: '11px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-card-bg)', color: 'var(--color-text)' }}
                />
                <input
                  type="number"
                  placeholder="Value..."
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  style={{ width: '30%', padding: '4px 8px', fontSize: '11px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-card-bg)', color: 'var(--color-text)' }}
                />
                <button type="button" onClick={addRow} className="admin-button-primary" style={{ padding: '2px 8px', fontSize: '11px' }}>Add</button>
              </div>
            </div>
          )}

          {/* Render Recharts chart */}
          <div style={{ width: '100%', height: 200, marginTop: '10px' }}>
            {type === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataRows}>
                  <XAxis dataKey="label" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <ChartTooltip />
                  <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {type === 'line' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataRows}>
                  <XAxis dataKey="label" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {type === 'pie' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip />
                  <Pie
                    data={dataRows}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                  >
                    {dataRows.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </NodeViewWrapper>
      );
    });
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

  // Popover states for custom toolbar dropdown widgets
  const [activePopover, setActivePopover] = useState(null); // 'table', 'icon', 'emoji', 'listStyle', 'cardTemplate', 'wordArt', 'border'
  const [aiLoading, setAiLoading] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: false,
        bulletList: false, // Override bulletList with CustomBulletList
        underline: false,  // Disabling to prevent duplicate extension name warning
        link: false,       // Disabling to prevent duplicate extension name warning
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
      FontFamily,
      Indent,
      LineHeight,
      TextBackground,
      ParagraphBorder,
      CustomBulletList,
      CommentMark,
      WordArt,
      CardTemplate,
      MathNode,
      VideoNode,
      ChartNode,
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
    if (!editor || editor.isDestroyed) return;
    const currentHTML = editor.getHTML();
    const targetHTML = value || '';
    if (currentHTML !== targetHTML && targetHTML !== '<p></p>') {
      editor.commands.setContent(targetHTML, false);
    }
  }, [value, editor]);

  // Handle clicking outside to close popovers
  useEffect(() => {
    const handleOutsideClick = () => setActivePopover(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const togglePopover = (e, name) => {
    e.stopPropagation();
    setActivePopover(prev => (prev === name ? null : name));
  };

  const addLink = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
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
    if (!editor || editor.isDestroyed) return;
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleImageUpload = useCallback(async (e) => {
    if (!editor || editor.isDestroyed) return;
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

  const insertCustomTable = useCallback((rows, cols) => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setActivePopover(null);
  }, [editor]);

  const insertComment = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const text = window.prompt('Enter comment:');
    if (text) {
      editor.chain().focus().setComment(text).run();
    }
  }, [editor]);

  const insertChart = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertContent({ type: 'chartNode' }).run();
  }, [editor]);

  const insertVideo = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertContent({ type: 'videoNode' }).run();
  }, [editor]);

  const insertSmartCard = useCallback((type) => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertContent({
      type: 'cardTemplate',
      attrs: { type },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: `This is a pre-styled ${type} card template. Add your content here.` }] }],
    }).run();
    setActivePopover(null);
  }, [editor]);

  const insertCustomTemplate = useCallback((html) => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertContent(html).run();
    setActivePopover(null);
  }, [editor]);

  const presetTemplates = [
    {
      name: '📚 Course Outline',
      html: `<div style="background-color: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; padding: 20px; margin: 15px 0;">
        <h3 style="color: var(--color-primary); margin-top: 0;">📚 Course Outline & Syllabus</h3>
        <p style="color: var(--color-text-muted); font-size: 13px;">Use this structure to organize your course modules and topics.</p>
        <hr style="border: 0; border-top: 1px solid var(--color-border); margin: 12px 0;" />
        <h4 style="margin: 10px 0;">🔴 Section 1: Introduction</h4>
        <p>Brief description of the section topic, key learning outcomes, and foundational concepts.</p>
        <h4 style="margin: 10px 0;">🔵 Section 2: Core Concepts</h4>
        <p>Detailed discussion, definitions, and mathematical equations.</p>
      </div>`
    },
    {
      name: '💡 Concept Card',
      html: `<div style="border-left: 6px solid var(--color-primary); background-color: rgba(20, 184, 166, 0.05); padding: 15px; border-radius: 8px; margin: 15px 0;">
        <strong style="color: var(--color-primary); font-size: 1.1em; display: block; margin-bottom: 6px;">💡 KEY TERM: Definition</strong>
        <p style="margin: 0; font-style: italic;">Enter the concept definition, meaning, or explanation here. You can also add examples or derivations below.</p>
      </div>`
    },
    {
      name: '🗓️ Weekly Planner',
      html: `<div style="border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; margin: 15px 0;">
        <div style="background-color: var(--color-primary); color: white; padding: 12px 16px; font-weight: bold;">🗓️ Weekly Study Schedule</div>
        <table style="width: 100%; border-collapse: collapse; margin: 0;">
          <thead>
            <tr style="background-color: var(--color-gray-100);">
              <th style="padding: 10px; border: 1px solid var(--color-border);">Day</th>
              <th style="padding: 10px; border: 1px solid var(--color-border);">Focus Subject</th>
              <th style="padding: 10px; border: 1px solid var(--color-border);">Study Goals</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid var(--color-border); font-weight: 600;">Monday</td>
              <td style="padding: 10px; border: 1px solid var(--color-border);">Subject A</td>
              <td style="padding: 10px; border: 1px solid var(--color-border);">Chapters 1-3 overview</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid var(--color-border); font-weight: 600;">Wednesday</td>
              <td style="padding: 10px; border: 1px solid var(--color-border);">Subject B</td>
              <td style="padding: 10px; border: 1px solid var(--color-border);">Practice test and formula review</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid var(--color-border); font-weight: 600;">Friday</td>
              <td style="padding: 10px; border: 1px solid var(--color-border);">Revision</td>
              <td style="padding: 10px; border: 1px solid var(--color-border);">Solve past year papers</td>
            </tr>
          </tbody>
        </table>
      </div>`
    },
    {
      name: '💻 Code Snippet Notes',
      html: `<div style="background-color: #1e1e2e; border-radius: 10px; padding: 16px; margin: 15px 0; color: #cdd6f4; font-family: monospace; border: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px; margin-bottom: 12px; font-size: 12px; color: #a6adc8;">
          <span>💻 js_example.js</span>
          <span>JavaScript</span>
        </div>
        <pre style="margin: 0; font-size: 13px; line-height: 1.5; color: #f5c2e7;">// Example Javascript snippet\nfunction computeGains(revenue, cost) {\n  return revenue - cost;\n}</pre>
        <div style="background-color: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px; margin-top: 12px; font-family: sans-serif; font-size: 12px; color: #bac2de;">
          <strong>Note:</strong> This function computes the net gains on courses sales.
        </div>
      </div>`
    },
    {
      name: '⚖️ Pros & Cons Table',
      html: `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 15px 0;">
        <div style="background-color: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 8px; padding: 16px;">
          <strong style="color: #15803d; font-size: 1.1em; display: block; margin-bottom: 8px;">✅ Pros / Advantages</strong>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Highly efficient and scalable.</li>
            <li>Seamless API integrations.</li>
          </ul>
        </div>
        <div style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 16px;">
          <strong style="color: #b91c1c; font-size: 1.1em; display: block; margin-bottom: 8px;">❌ Cons / Disadvantages</strong>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Requires high memory overhead.</li>
            <li>Steep initial learning curve.</li>
          </ul>
        </div>
      </div>`
    },
    {
      name: '💬 Gandhiji Quote',
      html: `<div style="background-color: var(--color-bg); border-top: 3px solid var(--color-primary); border-bottom: 3px solid var(--color-primary); padding: 20px; text-align: center; font-style: italic; margin: 15px 0; border-radius: 4px;">
        <p style="font-size: 1.25em; margin-bottom: 8px; color: var(--color-text);">"Live as if you were to die tomorrow. Learn as if you were to live forever."</p>
        <strong style="font-size: 0.9em; color: var(--color-primary-dark); font-style: normal;">— Mahatma Gandhi</strong>
      </div>`
    },
    {
      name: '📐 Math Theorem Box',
      html: `<div style="background-color: rgba(139, 92, 246, 0.03); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; padding: 16px; margin: 15px 0;">
        <strong style="color: #6d28d9; display: block; margin-bottom: 8px;">📐 Mathematical Theorem</strong>
        <p>For any right-angled triangle, the square of the length of the hypotenuse is equal to the sum of the squares of the lengths of the other two sides:</p>
        <div style="text-align: center; padding: 8px; font-size: 1.25em; font-weight: bold; color: var(--color-text);">a² + b² = c²</div>
      </div>`
    },
    {
      name: '❓ Q&A Section',
      html: `<div style="background-color: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: 8px; margin: 15px 0; overflow: hidden;">
        <div style="background-color: var(--color-gray-50); padding: 12px 16px; font-weight: 600; border-bottom: 1px solid var(--color-border);">❓ Question: What is photosynthesis?</div>
        <div style="padding: 16px; font-size: 14px; line-height: 1.6;">
          <strong>Answer:</strong> The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.
        </div>
      </div>`
    },
    {
      name: '🚨 Crimson Alert Banner',
      html: `<div style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 16px; margin: 15px 0; display: flex; gap: 12px; align-items: flex-start;">
        <span style="font-size: 20px;">🚨</span>
        <div>
          <strong style="color: #b91c1c; display: block; margin-bottom: 4px;">CRITICAL NOTICE</strong>
          <p style="margin: 0; font-size: 13px; color: var(--color-text-muted);">Please make sure to review all system configurations before deploying this build to server production.</p>
        </div>
      </div>`
    },
    {
      name: '🔗 Recommended Resources',
      html: `<div style="background-color: rgba(59, 130, 246, 0.05); border: 2px dashed rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 15px; margin: 15px 0;">
        <strong style="color: #1d4ed8; display: block; margin-bottom: 6px;">🔗 RECOMMENDED RESOURCES</strong>
        <p style="margin: 0 0 8px 0; font-size: 13px;">Follow these links to learn more about advanced React hooks and state management:</p>
        <a href="https://react.dev" style="color: #2563eb; text-decoration: underline; font-weight: 600;">Official React Documentation</a>
      </div>`
    },
    {
      name: '🏷️ Vocabulary Flashcard',
      html: `<div style="background-color: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 16px; max-width: 320px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h3 style="margin: 0 0 4px 0; color: var(--color-primary);">Ephemeral</h3>
        <span style="font-size: 12px; color: var(--color-text-muted); font-style: italic;">/ɪˈfemərəl/ • Adjective</span>
        <p style="margin: 10px 0 0 0; font-size: 13px;">Lasting for a very short time. e.g., "fashions are ephemeral."</p>
      </div>`
    },
    {
      name: '➕ Section Divider Line',
      html: `<div style="display: flex; align-items: center; margin: 24px 0 16px 0;">
        <span style="font-weight: 800; font-size: 1.1em; color: var(--color-primary); padding-right: 12px; text-transform: uppercase; letter-spacing: 0.05em;">New Section Title</span>
        <div style="flex: 1; border-bottom: 2px solid var(--color-primary); opacity: 0.3;"></div>
      </div>`
    }
  ];

  const insertIcon = useCallback((iconSvg) => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertContent(iconSvg).run();
    setActivePopover(null);
  }, [editor]);

  const insertEmoji = useCallback((emoji) => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertContent(emoji).run();
    setActivePopover(null);
  }, [editor]);

  const addMathBlock = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertContent({ type: 'mathNode', attrs: { latex: 'E = mc^2' } }).run();
  }, [editor]);

  const handleAIFormat = useCallback(async () => {
    if (!editor || editor.isDestroyed) return;
    
    const rawContent = editor.getHTML();
    if (!rawContent || rawContent === '<p></p>' || rawContent === '') {
      alert('Please type or insert some content first.');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/util/ai-format`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: rawContent }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'AI request failed');
      }
      
      // Update TipTap Editor with the beautifully formatted AI HTML
      editor.commands.setContent(data.formattedHtml);
    } catch (err) {
      console.error(err);
      alert(`AI Formatting failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  }, [editor]);

  // CodeBlock formatting logic
  const formatCodeBlock = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
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

  if (!editor || editor.isDestroyed) {
    return <div className="text-sm p-4 border rounded animate-pulse">Loading editor...</div>;
  }

  const getTypographyValue = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    if (editor.isActive('heading', { level: 6 })) return 'h6';
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

  const getFontFamilyValue = () => {
    return editor.getAttributes('textStyle').fontFamily || 'default';
  };

  const handleFontFamilyChange = (e) => {
    const family = e.target.value;
    if (family === 'default') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(family).run();
    }
  };

  const getLineHeightValue = () => {
    return editor.getAttributes('paragraph').lineHeight || '1.6';
  };

  const handleLineHeightChange = (e) => {
    const val = e.target.value;
    if (val === 'default') {
      editor.chain().focus().unsetLineHeight().run();
    } else {
      editor.chain().focus().setLineHeight(val).run();
    }
  };

  const increaseFontSize = () => {
    const currentSize = editor.getAttributes('textStyle').fontSize || '16px';
    const numericSize = parseInt(currentSize.replace('px', ''), 10) || 16;
    const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    const nextSize = sizes.find(s => s > numericSize) || (numericSize + 2);
    editor.chain().focus().setFontSize(`${nextSize}px`).run();
  };

  const decreaseFontSize = () => {
    const currentSize = editor.getAttributes('textStyle').fontSize || '16px';
    const numericSize = parseInt(currentSize.replace('px', ''), 10) || 16;
    const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    const prevSize = [...sizes].reverse().find(s => s < numericSize) || Math.max(8, numericSize - 2);
    editor.chain().focus().setFontSize(`${prevSize}px`).run();
  };

  // Preset svg icons for insertion
  const presetIcons = [
    { name: 'Star', svg: '⭐' },
    { name: 'Check', svg: '✔️' },
    { name: 'Warning', svg: '⚠️' },
    { name: 'Sparkles', svg: '✨' },
    { name: 'Pin', svg: '📌' },
    { name: 'Gift', svg: '🎁' },
    { name: 'Idea', svg: '💡' },
    { name: 'Fire', svg: '🔥' },
    { name: 'Target', svg: '🎯' },
    { name: 'Rocket', svg: '🚀' },
    { name: 'Heart', svg: '❤️' },
    { name: 'Notification', svg: '🔔' }
  ];

  // Emojis list
  const presetEmojis = ['😀', '😂', '😍', '👍', '🔥', '🎉', '👏', '⭐', '❤️', '🤔', '🙌', '✨', '💡', '🚀', '👀', '📌'];

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

        {/* AI Formatting */}
        <div className="rich-text-editor__group">
          <button
            type="button"
            className={`rich-text-editor__btn rich-text-editor__btn--ai ${aiLoading ? 'is-loading' : ''}`}
            onClick={handleAIFormat}
            disabled={aiLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.25)', borderRadius: '6px', color: 'var(--color-primary-dark)', fontWeight: '600', padding: '0 8px', height: '32px', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
            title="Auto-format content using Google Gemini AI"
          >
            {aiLoading ? '🤖 Formatting...' : <><Sparkles size={14} style={{ color: 'var(--color-primary)' }} /> AI Format</>}
          </button>
        </div>

        {/* Typography & Fonts Dropdowns */}
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
            <option value="h5">Heading 5</option>
            <option value="h6">Heading 6</option>
          </select>

          <select
            className="rich-text-editor__select"
            value={getFontFamilyValue()}
            onChange={handleFontFamilyChange}
            title="Font Family"
            style={{ marginRight: '4px', width: '110px' }}
          >
            <option value="default">Font (Default)</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Times New Roman, serif">Times New Roman</option>
            <option value="Courier New, monospace">Courier New</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Impact, sans-serif">Impact</option>
            <option value="Comic Sans MS, cursive">Comic Sans</option>
          </select>

          <select
            className="rich-text-editor__select"
            value={getFontSizeValue()}
            onChange={handleFontSizeChange}
            title="Font Size"
            style={{ marginRight: '4px' }}
          >
            <option value="default">Size (Default)</option>
            <option value="8px">8px</option>
            <option value="9px">9px</option>
            <option value="10px">10px</option>
            <option value="11px">11px</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="22px">22px</option>
            <option value="24px">24px</option>
            <option value="26px">26px</option>
            <option value="28px">28px</option>
            <option value="36px">36px</option>
            <option value="48px">48px</option>
            <option value="72px">72px</option>
          </select>

          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={increaseFontSize}
            title="Increase Font Size (A+)"
            style={{ marginRight: '2px' }}
          >
            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>A⁺</span>
          </button>
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={decreaseFontSize}
            title="Decrease Font Size (A-)"
          >
            <span style={{ fontWeight: 'bold', fontSize: '10px' }}>A⁻</span>
          </button>
        </div>

        {/* Line spacing & Indentation */}
        <div className="rich-text-editor__group">
          <select
            className="rich-text-editor__select"
            value={getLineHeightValue()}
            onChange={handleLineHeightChange}
            title="Line & Paragraph Spacing"
            style={{ marginRight: '4px', width: '85px' }}
          >
            <option value="1.0">Single (1.0)</option>
            <option value="1.15">1.15</option>
            <option value="1.3">1.3</option>
            <option value="1.5">1.5</option>
            <option value="1.6">1.6 (Default)</option>
            <option value="2.0">Double (2.0)</option>
          </select>

          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={() => editor.chain().focus().indent().run()}
            title="Increase Indent"
          >
            <IndentIcon />
          </button>
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={() => editor.chain().focus().outdent().run()}
            title="Decrease Indent"
          >
            <OutdentIcon />
          </button>
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

        {/* Colors & Background & Borders */}
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
          
          {/* Paragraph Border Dropdown (Wrapped in relative div, rendering popover as sibling) */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              className="rich-text-editor__btn"
              onClick={(e) => togglePopover(e, 'border')}
              title="Paragraph Borders"
            >
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Border</span>
            </button>
            {activePopover === 'border' && (
              <div className="rich-text-editor__popover" style={{ width: '130px' }} onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => { editor.chain().focus().setParagraphBorder('1px solid var(--color-border)').run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Light Border</button>
                <button type="button" onClick={() => { editor.chain().focus().setParagraphBorder('2px solid var(--color-primary)').run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Primary Border</button>
                <button type="button" onClick={() => { editor.chain().focus().setParagraphBorder('2px dashed #f59e0b').run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>Dashed Warning</button>
                <button type="button" onClick={() => { editor.chain().focus().unsetParagraphBorder().run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'red' }}>Remove Border</button>
              </div>
            )}
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

        {/* Word Art Selector (Popover as sibling to trigger) */}
        <div className="rich-text-editor__group">
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              className="rich-text-editor__btn"
              onClick={(e) => togglePopover(e, 'wordArt')}
              title="Word Art Creative Text"
              style={{ width: '85px' }}
            >
              <Sparkles size={14} style={{ marginRight: '3px' }} />
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Word Art</span>
            </button>
            {activePopover === 'wordArt' && (
              <div className="rich-text-editor__popover" style={{ width: '150px' }} onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => { editor.chain().focus().setWordArt('rainbow').run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-text)' }}>🌈 Rainbow</button>
                <button type="button" onClick={() => { editor.chain().focus().setWordArt('neon').run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-text)' }}>⚡ Neon Glow</button>
                <button type="button" onClick={() => { editor.chain().focus().setWordArt('outline').run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-text)' }}>🔲 Outline</button>
                <button type="button" onClick={() => { editor.chain().focus().setWordArt('retro').run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-text)' }}>📻 Retro Shadow</button>
                <button type="button" onClick={() => { editor.chain().focus().unsetWordArt().run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'red' }}>Remove Word Art</button>
              </div>
            )}
          </div>
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

        {/* Lists & Custom Bullet shapes (Popover as sibling) */}
        <div className="rich-text-editor__group">
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              className={`rich-text-editor__btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
              onClick={(e) => togglePopover(e, 'listStyle')}
              title="Bullet Point Custom Symbols"
            >
              <List />
            </button>
            {activePopover === 'listStyle' && (
              <div className="rich-text-editor__popover" style={{ width: '150px' }} onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => { editor.chain().focus().toggleBulletList().updateAttributes('bulletList', { listType: 'disc' }).run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>⬤ Default Circle</button>
                <button type="button" onClick={() => { editor.chain().focus().toggleBulletList().updateAttributes('bulletList', { listType: 'square' }).run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>◼️ Square Points</button>
                <button type="button" onClick={() => { editor.chain().focus().toggleBulletList().updateAttributes('bulletList', { listType: 'star' }).run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>★ Star Points</button>
                <button type="button" onClick={() => { editor.chain().focus().toggleBulletList().updateAttributes('bulletList', { listType: 'arrow' }).run(); setActivePopover(null); }} style={{ padding: '4px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>➔ Arrow Points</button>
              </div>
            )}
          </div>
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

        {/* Extra Blocks (Quote, Formatter, Comment) */}
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
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={insertComment}
            title="Insert Inline Comment"
          >
            <MessageSquare />
          </button>
        </div>

        {/* Popover Table selector, Emojis, Icons & Media */}
        <div className="rich-text-editor__group">
          
          {/* Interactive Table Picker (Popover as sibling) */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              className="rich-text-editor__btn"
              onClick={(e) => togglePopover(e, 'table')}
              title="Select Table rows and columns"
            >
              <TableIcon />
            </button>
            {activePopover === 'table' && (
              <div className="rich-text-editor__popover" onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', textAlign: 'center' }}>Insert Table Grid</div>
                <div className="table-selector-grid">
                  {Array.from({ length: 10 }).map((_, r) => (
                    Array.from({ length: 10 }).map((_, c) => (
                      <div
                        key={`${r}-${c}`}
                        className="table-selector-cell"
                        onMouseEnter={(e) => {
                          const cells = e.target.parentNode.children;
                          const idx = Array.from(cells).indexOf(e.target);
                          const hoverR = Math.floor(idx / 10);
                          const hoverC = idx % 10;
                          for (let i = 0; i < cells.length; i++) {
                            const curR = Math.floor(i / 10);
                            const curC = i % 10;
                            if (curR <= hoverR && curC <= hoverC) {
                              cells[i].classList.add('is-active');
                            } else {
                              cells[i].classList.remove('is-active');
                            }
                          }
                        }}
                        onClick={() => {
                          const parent = document.querySelector('.table-selector-grid');
                          const activeCells = parent.querySelectorAll('.is-active');
                          let maxR = 1;
                          let maxC = 1;
                          activeCells.forEach(cell => {
                            const cells = Array.from(parent.children);
                            const idx = cells.indexOf(cell);
                            maxR = Math.max(maxR, Math.floor(idx / 10) + 1);
                            maxC = Math.max(maxC, (idx % 10) + 1);
                          });
                          insertCustomTable(maxR, maxC);
                        }}
                      />
                    ))
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Emojis Picker (Popover as sibling) */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              className="rich-text-editor__btn"
              onClick={(e) => togglePopover(e, 'emoji')}
              title="Insert Emojis"
            >
              <Smile />
            </button>
            {activePopover === 'emoji' && (
              <div className="rich-text-editor__popover" onClick={e => e.stopPropagation()}>
                <div className="emoji-picker-grid">
                  {presetEmojis.map((emoji, idx) => (
                    <div
                      key={idx}
                      className="emoji-picker-item"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Icons Library Picker (Popover as sibling) */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              className="rich-text-editor__btn"
              onClick={(e) => togglePopover(e, 'icon')}
              title="Insert Custom Symbols / Icons"
            >
              <Maximize2 />
            </button>
            {activePopover === 'icon' && (
              <div className="rich-text-editor__popover" onClick={e => e.stopPropagation()}>
                <div className="icon-picker-grid">
                  {presetIcons.map((item, idx) => (
                    <div
                      key={idx}
                      className="icon-picker-item"
                      onClick={() => insertIcon(item.svg)}
                      title={item.name}
                      style={{ fontSize: '18px' }}
                    >
                      {item.svg}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart UI Card & Custom templates (Popover as sibling) */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              className="rich-text-editor__btn"
              onClick={(e) => togglePopover(e, 'cardTemplate')}
              title="Insert Pre-styled Smart Card template"
              style={{ width: '85px' }}
            >
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Templates</span>
            </button>
            {activePopover === 'cardTemplate' && (
              <div className="rich-text-editor__popover" style={{ width: '220px', maxHeight: '350px', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px', marginBottom: '4px', color: 'var(--color-primary-dark)' }}>Interactive Blocks</div>
                <button type="button" onClick={() => insertSmartCard('info')} style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'block', width: '100%' }}>ℹ️ Info Card Box</button>
                <button type="button" onClick={() => insertSmartCard('warning')} style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'block', width: '100%' }}>⚠️ Warning Alert Box</button>
                <button type="button" onClick={() => insertSmartCard('tip')} style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'block', width: '100%' }}>💡 Useful Tip Box</button>
                <button type="button" onClick={() => insertSmartCard('success')} style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'block', width: '100%' }}>✅ Success Card Box</button>
                
                <div style={{ fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px', marginTop: '8px', marginBottom: '4px', color: 'var(--color-primary-dark)' }}>Note Templates</div>
                {presetTemplates.map((t, idx) => (
                  <button 
                    key={idx} 
                    type="button" 
                    onClick={() => insertCustomTemplate(t.html)} 
                    style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'block', width: '100%' }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Chart */}
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={insertChart}
            title="Insert Interactive SVG Chart"
          >
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Chart</span>
          </button>

          {/* Video Node */}
          <button
            type="button"
            className="rich-text-editor__btn"
            onClick={insertVideo}
            title="Insert Local Video Upload or YouTube Embed"
          >
            <Play />
          </button>

          {/* LaTeX Equations */}
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
