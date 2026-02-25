const fs = require('fs');
const path = require('path');

// List of files with module-scope hook violations that need fixing
// These are the confirmed violations from the analysis
const filesToFix = [
  'components/Chama/SyncGrpLnsOut/index.tsx',
  'screens/Chama/BL/Cov/index.tsx',
  'components/Loans/LoanStts/P2PLoaner/index.tsx',
  'components/Loans/LoanStts/P2PLoanerDtld/index.tsx',
  'components/VwCredSales/Vw2Grant/Biz2Biz/index.tsx',
  'components/Loans/LoanStts/B2PLoaner/index.tsx',
  'components/Loans/LoanStts/B2PLoaneeDtld/index.tsx',
  'components/VwCredSales/Vw2Grant/Pal2Pal/index.tsx',
  'components/VwCredSales/Vw2Grant/Pal2Biz/index.tsx',
  'components/VwCredSales/ViewBizInfo/index.tsx',
  'components/Ads/VwPrsnlLns/index.tsx',
  'components/Loans/B2PLoanee/index.tsx',
  'screens/MyAcc/CreateAc/index.tsx',
];

console.log('🔍 Starting Hook Violation Fixer...\n');
console.log('📋 Files to analyze and potentially fix:');
filesToFix.forEach((file, i) => {
  console.log(`  ${i + 1}. ${file}`);
});

// Scan each file for violations
let violationCount = 0;
filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`\n⚠️  File not found: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  
  // Look for module-scope hook patterns
  const hookPatterns = [
    /^const \[.*\] = useState/,
    /^const \[.*\] = useContext/,
    /^useEffect\(/,
    /^const \w+ = useEffect/,
  ];
  
  let hasViolations = false;
  let violationLines = [];
  
  lines.forEach((line, lineNum) => {
    hookPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        hasViolations = true;
        violationCount++;
        violationLines.push({ line: lineNum + 1, code: line.trim() });
      }
    });
  });
  
  if (hasViolations) {
    console.log(`\n❌ ${file}:`);
    violationLines.forEach(v => {
      console.log(`   Line ${v.line}: ${v.code.substring(0, 60)}...`);
    });
  }
});

console.log(`\n\n📊 Total violations found: ${violationCount}`);
console.log('\n⚠️  CRITICAL: These files have React hooks at module scope.');
console.log('   Hooks MUST be moved inside component function bodies!');
console.log('\n✅ Create a component wrapper around the module-scope code.');
console.log('   Move all useState/useEffect/useContext calls INSIDE the wrapper function.');
