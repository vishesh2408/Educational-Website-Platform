const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true, breaks: true, linkify: true });

const testCases = [
  '**bold text**',
  '# Heading 1',
  '## Heading 2',
  '---',
  '- item 1\n- item 2',
  'Normal paragraph text'
];

testCases.forEach(test => {
  console.log('Input:', test);
  console.log('Output:', md.render(test));
  console.log('---');
});
