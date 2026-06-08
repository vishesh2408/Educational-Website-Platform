import React, { useMemo, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const QuillNoteEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);

  const init = useMemo(() => {
    return {
      height: 420,
      menubar: false,
      branding: false,
      statusbar: true,
      plugins: [
        // Core editing features
        'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
        // Premium trial features
        'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'ai', 'uploadcare', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf'
      ],
      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
      tinycomments_mode: 'embedded',
      tinycomments_author: 'Author name',
      mergetags_list: [
        { value: 'First.Name', title: 'First Name' },
        { value: 'Email', title: 'Email' },
      ],
      ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
      uploadcare_public_key: process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY,
    };
  }, []);

  return (
    <div className="quill-note-editor">
      <Editor
        apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
        onInit={(_, editor) => (editorRef.current = editor)}
        value={String(value || '')}
        init={init}
        onEditorChange={(html) => onChange(html)}
      />
    </div>
  );
};

export default QuillNoteEditor;
