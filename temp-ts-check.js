const ts = require('typescript');
const path = 'screens/Ads/Search/PartialPayFlow/index.tsx';
const program = ts.createProgram([path], {
  jsx: 'react-jsx',
  allowJs: true,
  checkJs: false,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  skipLibCheck: true,
  noEmit: true
});
const diags = ts.getPreEmitDiagnostics(program);
console.log(diags.length);
diags.forEach(d => {
  const file = d.file;
  const loc = file ? file.getLineAndCharacterOfPosition(d.start) : { line: 0, character: 0 };
  console.log((file ? file.fileName : '') + ':' + (loc.line + 1) + ':' + (loc.character + 1) + ' ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));
});
