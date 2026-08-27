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

function findCalls() {
  const nameSet = readHomeNames();
  const files = walk(root);
  const results = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    let idx = 0;
    while (true) {
      const pos = src.indexOf('.navigate(', idx);
      if (pos === -1) break;
      // find var
      let varStart = pos - 1;
      while (varStart >= 0 && /[A-Za-z0-9_.$]/.test(src[varStart])) varStart--;
      varStart++;
      const navVar = src.slice(varStart, pos);
      const openParen = src.indexOf('(', pos + 1);
      if (openParen === -1) break;
      let i = openParen + 1;
      while (i < src.length && /\s/.test(src[i])) i++;
      const quote = src[i];
      if (quote !== '"' && quote !== "'") { idx = pos + 10; continue; }
      let j = i + 1; let name = '';
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === quote) break;
        name += src[j]; j++;
      }
      if (nameSet.has(name)) results.push({ file, navVar, name, context: src.slice(Math.max(0,pos-60), pos+60) });
      idx = pos + 10;
    }
  }
  return results;
}

const res = findCalls();
console.log('Remaining calls:', res.length);
for (let i=0;i<Math.min(200,res.length);i++) {
  const r = res[i];
  console.log(r.file);
}
