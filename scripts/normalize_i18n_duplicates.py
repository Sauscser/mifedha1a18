import json
from pathlib import Path
from collections import OrderedDict

src = Path('i18n-strings-collection.json')
text = src.read_text(encoding='utf-8')


def uniq_list(values):
    seen = OrderedDict()
    for item in values:
        key = json.dumps(item, ensure_ascii=False, sort_keys=True) if isinstance(item, (dict, list)) else ('__SCALAR__', item)
        seen[key] = item
    return list(seen.values())


def merge_values(a, b):
    if isinstance(a, dict) and isinstance(b, dict):
        out = OrderedDict()
        for k, v in a.items():
            out[k] = v
        for k, v in b.items():
            if k in out:
                out[k] = merge_values(out[k], v)
            else:
                out[k] = v
        return out
    if isinstance(a, list) and isinstance(b, list):
        return uniq_list(a + b)
    if isinstance(a, list):
        return uniq_list(a + [b])
    if isinstance(b, list):
        return uniq_list([a] + b)
    if a == b:
        return a
    return uniq_list([a, b])


def pairs_to_obj(pairs):
    out = OrderedDict()
    for k, v in pairs:
        if k in out:
            out[k] = merge_values(out[k], v)
        else:
            out[k] = v
    return out


data = json.loads(text, object_pairs_hook=pairs_to_obj)

src.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('NORMALIZED_OK')
