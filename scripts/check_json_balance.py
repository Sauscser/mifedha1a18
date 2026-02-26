import pathlib

path = pathlib.Path('i18n-strings-collection.json')
text = path.read_text(encoding='utf-8')

in_string = False
escape = False
brace = 0
bracket = 0

for index, ch in enumerate(text, start=1):
    if in_string:
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == '"':
            in_string = False
        continue

    if ch == '"':
        in_string = True
    elif ch == '{':
        brace += 1
    elif ch == '}':
        brace -= 1
    elif ch == '[':
        bracket += 1
    elif ch == ']':
        bracket -= 1

print('brace_balance', brace)
print('bracket_balance', bracket)
