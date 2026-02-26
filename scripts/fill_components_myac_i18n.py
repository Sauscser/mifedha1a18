import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMP_MYAC = ROOT / "components" / "MyAc"
I18N = ROOT / "i18n-strings-collection.json"

RE_ALERT = re.compile(r"Alert\.alert\(\s*([\"'])(.*?)\1(?:\s*,\s*([\"'])(.*?)\3)?", re.S)
RE_PLACEHOLDER = re.compile(r"placeholder\s*=\s*([\"'])(.*?)\1", re.S)
RE_TEXT = re.compile(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", re.S)


def normalize(value: str) -> str:
    return " ".join((value or "").split()).strip()


def merge_unique(existing, incoming):
    out = list(existing or [])
    for item in incoming or []:
        if item not in out:
            out.append(item)
    return out


def ensure_node(base: dict, path_parts):
    node = base
    for part in path_parts:
        node = node.setdefault(part, {})
    return node


def extract_from_file(path: Path):
    src = path.read_text(encoding="utf-8", errors="ignore")

    alerts = []
    for m in RE_ALERT.finditer(src):
        a = normalize(m.group(2))
        b = normalize(m.group(4))
        if a and "${" not in a and a not in alerts:
            alerts.append(a)
        if b and "${" not in b and b not in alerts:
            alerts.append(b)

    placeholders = []
    for m in RE_PLACEHOLDER.finditer(src):
        text = normalize(m.group(2))
        if text and text not in placeholders:
            placeholders.append(text)

    labels = []
    for m in RE_TEXT.finditer(src):
        text = normalize(m.group(1))
        if not text or "${" in text:
            continue
        if text in alerts or text in placeholders or text in labels:
            continue
        if len(text) > 100:
            continue
        labels.append(text)

    buttons = []
    lines = src.splitlines()
    for i, line in enumerate(lines):
        if "TouchableOpacity" in line or "Pressable" in line:
            for j in range(i, min(i + 10, len(lines))):
                mt = re.search(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", lines[j])
                if mt:
                    t = normalize(mt.group(1))
                    if t and len(t) <= 80 and t not in buttons:
                        buttons.append(t)
                    break

    return {
        "alerts": alerts,
        "labels": labels,
        "buttons": buttons,
        "placeholders": placeholders,
    }


def main():
    data = json.loads(I18N.read_text(encoding="utf-8"))
    comp = data.setdefault("components", {})
    myac = comp.setdefault("MyAc", {})

    updated = 0
    for path in sorted(COMP_MYAC.rglob("index.*")):
        if path.suffix.lower() not in {".ts", ".tsx", ".js", ".jsx"}:
            continue

        rel_parts = path.relative_to(COMP_MYAC).with_suffix("").parts[:-1]
        if not rel_parts:
            continue

        node = ensure_node(myac, rel_parts)
        extracted = extract_from_file(path)
        for key, values in extracted.items():
            if values:
                node[key] = merge_unique(node.get(key, []), values)
                updated += 1

    I18N.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"UPDATED_ENTRIES {updated}")


if __name__ == "__main__":
    main()
