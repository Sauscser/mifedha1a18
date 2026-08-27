import re, pathlib
root = pathlib.Path(r'd:/mifedha1a18')
text = (root / 'screens' / 'CredSls' / 'index.tsx').read_text(encoding='utf-8')
handlers = re.findall(r'const\s+([A-Za-z0-9_]+)\s*=\s*\(\)\s*=>\s*\{\s*\n\s*navigation\.navigate\(([^)]+)\)', text)
buttons = re.findall(r'onPress\s*:\s*([A-Za-z0-9_]+)', text)
navtext = (root / 'navigation' / 'HomeTabNav' / 'index.tsx').read_text(encoding='utf-8')
allnames = set()
for m in re.finditer(r"Stack\.Screen\s+name=\{?'(.*?)'\}?", navtext):
    allnames.add(m.group(1))
for m in re.finditer(r"Stack\.Screen name=\{?'(.*?)'\}?", navtext):
    allnames.add(m.group(1))
for m in re.finditer(r"'([A-Za-z0-9_]+)'", navtext):
    allnames.add(m.group(1))
missing = []
for name, arg in handlers:
    argname = arg.strip().strip('"\'')
    if argname not in allnames:
        missing.append((name, argname))
print('handlers count', len(handlers))
print('buttons count', len(set(buttons)))
print('missing target count', len(missing))
for name, argname in missing:
    print('MISSING', name, '->', argname)
print('buttons with no handler:')
for b in sorted(set(buttons) - set(h[0] for h in handlers)):
    print('BUTTON NO HANDLER', b)
