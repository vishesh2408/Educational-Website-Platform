/* src/components/QuillNoteEditor.jsx */
import React from 'react';
import RichTextEditor from './RichTextEditor';

const QuillNoteEditor = ({ value, onChange }) => {
  return (
    <div className="quill-note-editor">
      <RichTextEditor value={value} onChange={onChange} />
    </div>
  );
};

export default QuillNoteEditor;
