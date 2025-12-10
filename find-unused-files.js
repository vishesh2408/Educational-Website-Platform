const fs = require('fs');
const path = require('path');

// Simple static reachability analyzer for project files (JS/JSX/CSS/etc.).
// It builds a dependency graph from import/require statements and reports
// files that are not reachable from the configured entry points.

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.scss', '.sass'];
const IGNORE_DIRS = new Set(['node_modules', '.git', 'build', 'dist', 'coverage', '.next', '.cache', 'public']);

const roots = [
  {
    name: 'frontend',
    root: path.resolve(__dirname, 'myedu/src'),
    entries: [path.resolve(__dirname, 'myedu/src/index.js')],
  },
  {
    name: 'backend',
    root: path.resolve(__dirname, 'backend'),
    entries: [path.resolve(__dirname, 'backend/server.js')],
  },
];

function collectFiles(root) {
  const files = new Set();
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      const base = path.basename(current);
      if (IGNORE_DIRS.has(base)) continue;
      for (const entry of fs.readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
    } else {
      if (EXTENSIONS.includes(path.extname(current))) {
        files.add(path.resolve(current));
      }
    }
  }
  return files;
}

function parseDeps(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const deps = [];
  const importRegex = /(?:import\s+[^'";]+from\s*['"]([^'";]+)['"]|import\s*['"]([^'";]+)['"]|require\(\s*['"]([^'";]+)['"]\s*\))/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const dep = match[1] || match[2] || match[3];
    if (dep && dep.startsWith('.')) deps.push(dep);
  }
  return deps;
}

function resolveImport(specifier, fromFile, allFiles) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [];

  // Exact file with extension
  candidates.push(base);
  // Try with known extensions
  for (const ext of EXTENSIONS) {
    candidates.push(base + ext);
  }
  // Directory index resolution
  for (const ext of EXTENSIONS) {
    candidates.push(path.join(base, 'index' + ext));
  }

  for (const candidate of candidates) {
    if (allFiles.has(candidate)) return candidate;
  }
  return null;
}

function buildGraph(files) {
  const graph = new Map();
  for (const file of files) {
    const deps = parseDeps(file);
    graph.set(file, deps);
  }
  return graph;
}

function findReachable(entries, graph, allFiles) {
  const reachable = new Set();
  const queue = [...entries.filter((f) => allFiles.has(f))];
  while (queue.length) {
    const file = queue.shift();
    if (reachable.has(file)) continue;
    reachable.add(file);
    const deps = graph.get(file) || [];
    for (const dep of deps) {
      const resolved = resolveImport(dep, file, allFiles);
      if (resolved && !reachable.has(resolved)) queue.push(resolved);
    }
  }
  return reachable;
}

function analyzeRoot({ name, root, entries }) {
  if (!fs.existsSync(root)) {
    console.error(`[${name}] root missing: ${root}`);
    return { unused: [], total: 0 };
  }
  const files = collectFiles(root);
  const graph = buildGraph(files);
  const reachable = findReachable(entries, graph, files);
  const unused = Array.from(files).filter((f) => !reachable.has(f)).sort();
  return { unused, total: files.size };
}

for (const config of roots) {
  const { name } = config;
  const result = analyzeRoot(config);
  console.log(`\n[${name}] files: ${result.total}, unused: ${result.unused.length}`);
  for (const file of result.unused) {
    console.log(`  - ${path.relative(__dirname, file)}`);
  }
}
