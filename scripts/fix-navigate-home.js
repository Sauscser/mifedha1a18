const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const homeNavFile = path.join(root, 'navigation', 'HomeTabNav', 'index.tsx');

function readHomeNames() {
  const src = fs.readFileSync(homeNavFile, 'utf8');
  const m = src.match(/export const HomeStackScreenNames = \[([\s\S]*?)\];/m);
  if (!m) return [];
  const arrSrc = m[1];
  // crude: match quoted strings
  const names = Array.from(arrSrc.matchAll(/['\"]([^'\"]+)['\"]/g)).map(x=>x[1]);
  return names;
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

function run() {
  const homeNames = readHomeNames();
  console.log('Home names:', homeNames.length);
  const files = walk(root);
  let changed = 0;
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    let out = src;
    // replace navigation.navigate('Name', ...) and navigation.navigate("Name" ...)
    for (const name of homeNames) {
      const re = new RegExp("(navigation\\.navigate\s*\(\s*)['\"]"+escapeReg(name)+"['\"](\s*(,|\)))","g");
      // replace with navigateToHomeNested('Name', ...)
      out = out.replace(re, (m, p1, p2, p3) => {
        // if already replaced or using navigateToHomeNested, skip
        if (m.includes('navigateToHomeNested') || m.includes('safeNavigateFrom')) return m;
        // build replacement: navigationHelper.navigateToHomeNested('Name', <restParam>) or navigateToHomeNested('Name') if no params
        if (p3 === ',') {
          // has params following
          return p1 + "navigateToHomeNested('"+name+"', ";
        } else {
          return p1 + "navigateToHomeNested('"+name+"')" + p3;
        }
      });
    }

    if (out !== src) {
      // ensure import present
      if (!/navigateToHomeNested/.test(src)) {
        // try to add import at top
        const importStmt = "import { navigateToHomeNested } from '../src/utils/navigationHelper';\n";
        // locate first import or top
        const lines = out.split(/\r?\n/);
        let insertAt = 0;
        for (let i=0;i<Math.min(40, lines.length);i++) {
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

function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

run();
