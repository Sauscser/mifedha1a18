#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Fix all src/ imports in screen files by calculating the correct relative path.
 * Screens are at depth 3-8 levels, so we need to calculate correctly.
 */

function getDepth(filePath) {
  const rel = path.relative(process.cwd(), filePath);
  // Count only "screens" onwards
  const parts = rel.split(path.sep);
  const screenIdx = parts.indexOf('screens');
  if (screenIdx === -1) return parts.length - 1;
  return parts.length - screenIdx - 1; // -1 for the filename itself
}

function fixImportsInFile(filePath) {
  const screenDepth = getDepth(filePath);
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Match import statements with wrong path counts:
  // The script should replace ANY instance of 'src/...' that is reached through ../ 
  // Calculate correct prefix: from a screen file, go up to root then into src
  // screens/X has depth 1, screens/X/Y has depth 2, etc.
  // So correct path is '../'.repeat(screenDepth) + 'src/...'
  if (screenDepth <= 0) return false; // safety check

  const correctPrefix = '../'.repeat(screenDepth) + 'src/';

  // Replace any malformed src/ imports (with extra src or wrong depth)
  // Match patterns like: from '(.../)+(src/)*src/...'
  content = content.replace(
    /from\s+['"](\.\.\/)+(src\/)*(.*?)['"]/g,
    (match, dots, srcPart, rest) => {
      // Reconstruct with correct depth
      return `from '${correctPrefix}${rest}'`;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${filePath} (depth=${screenDepth})`);
    return true;
  }
  return false;
}

function walkScreens(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      count += walkScreens(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      if (fixImportsInFile(fullPath)) {
        count++;
      }
    }
  }
  return count;
}

const screensDir = path.join(process.cwd(), 'screens');
const fixed = walkScreens(screensDir);
console.log(`\nFixed ${fixed} file(s) total.`);

