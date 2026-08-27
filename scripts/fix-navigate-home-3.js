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
  return new Set(names.filter(Boolean));
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

function findClosingParen(s, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function run() {
  const nameSet = readHomeNames();
  console.log('Home names:', nameSet.size);
  const files = walk(root);
  let changed = 0;

  for (const file of files) {
    let src = fs.readFileSync(file, 'utf8');
    let out = src;
    let idx = 0;
    let modified = false;
    while (true) {
      const pos = out.indexOf('.navigate(', idx);
      if (pos === -1) break;
      // find nav variable name before the dot
      let varStart = pos - 1;
      while (varStart >= 0 && /[A-Za-z0-9_.$]/.test(out[varStart])) varStart--;
      varStart++;
      const navVar = out.slice(varStart, pos);
      const openParen = out.indexOf('(', pos + 1);
      if (openParen === -1) break;
      const firstChar = out[openParen + 1];
      // skip whitespace
      let i = openParen + 1;
      while (i < out.length && /\s/.test(out[i])) i++;
      const quote = out[i];
      if (quote !== '"' && quote !== "'") {
        idx = pos + 10; // skip
        continue;
      }
      // parse quoted string
      let j = i + 1;
      let name = '';
      while (j < out.length) {
        if (out[j] === '\\') { j += 2; continue; }
        if (out[j] === quote) break;
        name += out[j];
        j++;
      }
      if (j >= out.length) break;
      const afterQuote = j + 1;
      // find closing paren for the navigate call
      const close = findClosingParen(out, openParen);
      if (close === -1) break;
      const argsInside = out.slice(afterQuote, close).trim();
      // remove leading comma if present
      let params = argsInside.startsWith(',') ? argsInside.slice(1).trim() : argsInside;

      if (nameSet.has(name)) {
        // prepare replacement
        let replacement = '';
        if (params.length > 0) replacement = `safeNavigateFrom(${navVar}, '${name}', ${params})`;
        else replacement = `safeNavigateFrom(${navVar}, '${name}')`;
        out = out.slice(0, varStart) + replacement + out.slice(close + 1);
        modified = true;
        idx = varStart + replacement.length;
      } else {
        idx = pos + 10;
      }
    }

    if (modified) {
      if (!/safeNavigateFrom\s*\(/.test(src)) {
        const importPath = makeImportPath(file);
        const importStmt = `import { safeNavigateFrom } from '${importPath}';\n`;
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
    }
  }

  console.log('Done. Changed files:', changed);
}

run();
