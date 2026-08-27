const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const homeNavFile = path.join(root, 'navigation', 'HomeTabNav', 'index.tsx');

function readHomeNames() {
  const src = fs.readFileSync(homeNavFile, 'utf8');
  const m = src.match(/export const HomeStackScreenNames = \[([\s\S]*?)\];/m);
  if (!m) return [];
  const arrSrc = m[1];
  const names = Array.from(arrSrc.matchAll(/['\"]([^'\"]+)['\"]/g)).map(x=>x[1]);
  return names.filter(Boolean);
}

function walk(dir) {
  const res = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) res.push(...walk(p));
    else if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) res.push(p);
  }
  return res;
}

function backup(file) {
  const b = file + '.bak';
  if (!fs.existsSync(b)) fs.copyFileSync(file, b);
}

function makeImportPath(filePath) {
  const rel = path.relative(path.dirname(filePath), path.join(root, 'src', 'utils', 'navigationHelper'));
  let p = rel.replace(/\\/g, '/');
  if (!p.startsWith('.')) p = './' + p;
  return p;
}

function run() {
  const homeNames = readHomeNames();
  console.log('Home names:', homeNames.length);
  const files = walk(root);
  let changed = 0;
  const nameSet = new Set(homeNames);

  // build regex to match any of the names
  const joined = homeNames.map(n => n.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const re = new RegExp("([A-Za-z0-9_.$]+)\\.navigate\\s*\\(\\s*(['\"])(' + joined + ')\\2\\s*(?:,([\s\S]*?))?\\)", 'g');

  for (const file of files) {
    let src = fs.readFileSync(file, 'utf8');
    let out = src;
    out = out.replace(re, (m, navVar, q, screenName, params) => {
      // don't touch lines already using safeNavigateFrom
      if (/safeNavigateFrom\s*\(/.test(m)) return m;
      params = params ? params.trim() : '';
      if (params.endsWith(',')) params = params.slice(0, -1).trim();
      if (params) return `safeNavigateFrom(${navVar}, '${screenName}', ${params})`;
      return `safeNavigateFrom(${navVar}, '${screenName}')`;
    });

    if (out !== src) {
      // add import if missing
      if (!/safeNavigateFrom/.test(src)) {
        const importPath = makeImportPath(file);
        const importStmt = `import { safeNavigateFrom } from '${importPath}';\n`;
        // place after last existing import or at top
        const lines = out.split(/\r?\n/);
        let insertAt = 0;
        for (let i=0;i<Math.min(80, lines.length);i++) {
          if (/^import\s/.test(lines[i])) insertAt = i+1;
        }
        lines.splice(insertAt, 0, importStmt);
        out = lines.join('\n');
      }
      backup(file);
      fs.writeFileSync(file, out, 'utf8');
      changed++;
      console.log('Patched', file);
      src = out;
    }
  }
  console.log('Done. Changed files:', changed);
}

run();
