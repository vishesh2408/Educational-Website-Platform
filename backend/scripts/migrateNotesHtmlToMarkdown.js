// migrateNotesHtmlToMarkdown.js
//
// Converts legacy HTML Notes (and their version history) into Markdown.
// Also updates linked Topic.articles[0].content (HTML) to stay in sync.
//
// Usage:
//   node scripts/migrateNotesHtmlToMarkdown.js --dry-run
//   node scripts/migrateNotesHtmlToMarkdown.js --apply
//   node scripts/migrateNotesHtmlToMarkdown.js --apply --limit=50
//
// Notes:
// - Requires MONGO_URI in environment or .env
// - Only converts notes where note.format === 'html' (or missing/invalid)

require('dotenv').config();

const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');
const TurndownService = require('turndown');
const { gfm, tables, strikethrough } = require('turndown-plugin-gfm');

let marked = null;
try {
  marked = require('marked');
} catch (e) {
  // optional
}

const Note = require('../models/Note');
const Topic = require('../models/Topic');

function parseArgs(argv) {
  const args = {
    apply: false,
    dryRun: false,
    limit: null,
  };

  for (const raw of argv.slice(2)) {
    if (raw === '--apply') args.apply = true;
    else if (raw === '--dry-run') args.dryRun = true;
    else if (raw.startsWith('--limit=')) {
      const v = Number(raw.split('=')[1]);
      if (!Number.isNaN(v) && v > 0) args.limit = v;
    }
  }

  if (!args.apply) args.dryRun = true;
  return args;
}

function markdownToHtml(inputMarkdown) {
  if (!inputMarkdown) return '';
  if (!marked) return String(inputMarkdown);
  try {
    return marked.parse(String(inputMarkdown), { mangle: false, headerIds: false });
  } catch (e) {
    return String(inputMarkdown);
  }
}

function cleanHtml(inputHtml) {
  if (!inputHtml) return inputHtml;
  const options = {
    allowedTags: (sanitizeHtml.defaults.allowedTags || []).concat([
      'h1','h2','h3','h4','h5','h6',
      'img','figure','figcaption',
      'table','thead','tbody','tr','th','td',
      'pre','code','blockquote','ul','ol','li','p','a','strong','em'
    ]),
    allowedAttributes: Object.assign({}, sanitizeHtml.defaults.allowedAttributes, {
      a: (sanitizeHtml.defaults.allowedAttributes.a || []).concat(['href','name','target','rel']),
      img: ['src','alt','width','height','loading']
    }),
    allowedSchemes: ['http','https','mailto','tel'],
    transformTags: {
      img: function(tagName, attribs) {
        const src = attribs.src || '';
        if (src.startsWith('/')) {
          return { tagName: 'img', attribs: { src, alt: attribs.alt || '' } };
        }
        if (src.startsWith('/api/admin/util/proxy')) {
          return { tagName: 'img', attribs: { src, alt: attribs.alt || '' } };
        }
        try {
          const encoded = encodeURIComponent(src);
          return { tagName: 'img', attribs: { src: '/api/admin/util/proxy?url=' + encoded, alt: attribs.alt || '' } };
        } catch (e) {
          return { tagName: 'img', attribs: { alt: attribs.alt || '' } };
        }
      }
    }
  };
  return sanitizeHtml(inputHtml, options);
}

function htmlToPlainText(html) {
  // strip all tags; keep only text
  return sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

function createTurndown() {
  const service = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full'
  });

  // GitHub-flavored markdown support
  service.use(gfm);
  service.use([tables, strikethrough]);

  // Preserve fenced code blocks and try to carry language from class="language-xxx"
  service.addRule('fencedCodeBlockWithLanguage', {
    filter: function(node) {
      if (!node || node.nodeName !== 'PRE') return false;
      const code = node.firstChild;
      return code && code.nodeName === 'CODE';
    },
    replacement: function(content, node) {
      const codeNode = node.firstChild;
      const className = (codeNode.getAttribute && codeNode.getAttribute('class')) ? codeNode.getAttribute('class') : '';
      const match = className && className.match(/language-([a-zA-Z0-9_+-]+)/);
      const lang = match ? match[1] : '';

      const rawText = (codeNode.textContent || '').replace(/\n+$/, '');
      const fence = '```';
      return `\n\n${fence}${lang}\n${rawText}\n${fence}\n\n`;
    }
  });

  return service;
}

function normalizeNoteFormat(note) {
  const fmt = (note && note.format) ? String(note.format).toLowerCase() : '';
  if (fmt === 'markdown') return 'markdown';
  if (fmt === 'html' || !fmt) return 'html';
  return 'html';
}

async function main() {
  const args = parseArgs(process.argv);
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in environment or .env');
    process.exit(2);
  }

  console.log(`[migrateNotesHtmlToMarkdown] mode=${args.apply ? 'APPLY' : 'DRY-RUN'} limit=${args.limit || 'none'}`);

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const turndown = createTurndown();

  const query = {
    $or: [
      { format: { $exists: false } },
      { format: null },
      { format: '' },
      { format: 'html' }
    ]
  };

  const cursor = Note.find(query).cursor();
  let scanned = 0;
  let convertedNotes = 0;
  let convertedVersions = 0;
  let updatedTopics = 0;
  let errors = 0;

  for await (const note of cursor) {
    scanned += 1;
    if (args.limit && convertedNotes >= args.limit) break;

    const format = normalizeNoteFormat(note);
    if (format !== 'html') continue;

    const beforeHtml = String(note.content || '');
    let markdown = '';

    try {
      markdown = turndown.turndown(beforeHtml);
      if (!String(markdown || '').trim()) {
        const plain = htmlToPlainText(beforeHtml);
        if (plain) markdown = plain;
      }
    } catch (e) {
      errors += 1;
      console.warn(`WARN: Note ${note._id} HTML->MD failed: ${e.message}`);
      continue;
    }

    // Convert versions too
    if (Array.isArray(note.versions)) {
      for (const v of note.versions) {
        const vFmt = (v && v.format) ? String(v.format).toLowerCase() : 'html';
        if (vFmt === 'html') {
          try {
            const vHtml = String(v.content || '');
            let vMd = turndown.turndown(vHtml);
            if (!String(vMd || '').trim()) {
              const plain = htmlToPlainText(vHtml);
              if (plain) vMd = plain;
            }
            v.content = vMd;
            v.format = 'markdown';
            convertedVersions += 1;
          } catch (e) {
            errors += 1;
            console.warn(`WARN: Note ${note._id} version HTML->MD failed: ${e.message}`);
          }
        }
      }
    }

    note.content = markdown;
    note.format = 'markdown';

    if (args.apply) {
      await note.save();
    }

    convertedNotes += 1;

    // Update linked Topic article HTML so course content stays correct
    if (note.topicId) {
      try {
        const topic = await Topic.findById(note.topicId);
        if (topic) {
          const syncedHtml = cleanHtml(markdownToHtml(markdown || ''));
          const nextArticles = Array.isArray(topic.articles) ? [...topic.articles] : [];
          if (nextArticles.length === 0) {
            nextArticles.push({ heading: note.title || '', content: syncedHtml, order: 0 });
          } else {
            const first = nextArticles[0] && nextArticles[0].toObject ? nextArticles[0].toObject() : (nextArticles[0] || {});
            nextArticles[0] = { ...first, content: syncedHtml };
            if (!nextArticles[0].heading) nextArticles[0].heading = note.title || '';
          }
          topic.articles = nextArticles;
          topic.updatedAt = new Date();
          if (args.apply) {
            await topic.save();
          }
          updatedTopics += 1;
        }
      } catch (e) {
        errors += 1;
        console.warn(`WARN: Topic sync failed for note ${note._id}: ${e.message}`);
      }
    }

    if (convertedNotes % 50 === 0) {
      console.log(`Progress: convertedNotes=${convertedNotes} scanned=${scanned} updatedTopics=${updatedTopics} errors=${errors}`);
    }
  }

  console.log('--- Summary ---');
  console.log('Scanned notes:', scanned);
  console.log('Converted notes:', convertedNotes);
  console.log('Converted versions:', convertedVersions);
  console.log('Updated topics:', updatedTopics);
  console.log('Errors:', errors);

  await mongoose.disconnect();
  console.log('Disconnected');

  if (!args.apply) {
    console.log('Dry-run only. Re-run with --apply to persist changes.');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
