const fs = require('fs');
const path = require('path');

// Simple unused-CSS detector for this workspace.
// Scans component .css files under src/ and reports class selectors that
// don't appear in any source files under src/ (basic substring search).

const SRC_DIR = path.resolve(__dirname, '..', 'src');

function walk(dir, exts = []) {
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const d of list) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) results.push(...walk(full, exts));
    else {
      if (exts.length === 0 || exts.includes(path.extname(d.name))) results.push(full);
    }
  }
  return results;
}

function extractClassesFromCss(cssText) {
  const re = /\.([a-zA-Z0-9_-]+)/g;
  const set = new Set();
  let m;
  while ((m = re.exec(cssText)) !== null) set.add(m[1]);
  return Array.from(set);
}

function fileContainsClass(fileText, className) {
  // look for className in a few common patterns
  return (
    fileText.includes(className) ||
    fileText.includes(`class="${className}"`) ||
    fileText.includes(`className="${className}"`) ||
    fileText.includes(`"${className} `)
  );
}

function main() {
  const cssFiles = walk(SRC_DIR).filter(f => f.endsWith('.css'));
  const srcFiles = walk(SRC_DIR, ['.js', '.jsx', '.ts', '.tsx', '.html', '.css']);

  const srcContents = {};
  for (const f of srcFiles) {
    try { srcContents[f] = fs.readFileSync(f, 'utf8'); } catch (e) { srcContents[f] = ''; }
  }

  const report = {};
  for (const cssFile of cssFiles) {
    const cssText = fs.readFileSync(cssFile, 'utf8');
    const classes = extractClassesFromCss(cssText);
    const unused = [];
    for (const cls of classes) {
      let used = false;
      for (const f of Object.keys(srcContents)) {
        if (srcContents[f].includes(cls)) { used = true; break; }
      }
      if (!used) unused.push(cls);
    }
    if (unused.length) report[path.relative(process.cwd(), cssFile)] = unused;
  }

  console.log(JSON.stringify(report, null, 2));
}

main();
