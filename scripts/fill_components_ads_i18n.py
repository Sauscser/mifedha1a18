import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
I18N = ROOT / "i18n-strings-collection.json"
COMP_ADS = ROOT / "components" / "Ads"

RE_ALERT = re.compile(r"Alert\.alert\(\s*([\"'])(.*?)\1(?:\s*,\s*([\"'])(.*?)\3)?", re.S)
RE_PLACEHOLDER = re.compile(r"placeholder\s*=\s*([\"'])(.*?)\1", re.S)
RE_TEXT = re.compile(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", re.S)


def normalize(text: str) -> str:
    return " ".join((text or "").split()).strip()


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
        first = normalize(m.group(2))
        second = normalize(m.group(4))
        if first and "${" not in first and first not in alerts:
            alerts.append(first)
        if second and "${" not in second and second not in alerts:
            alerts.append(second)

    placeholders = []
    for m in RE_PLACEHOLDER.finditer(src):
        value = normalize(m.group(2))
        if value and value not in placeholders:
            placeholders.append(value)

    labels = []
    for m in RE_TEXT.finditer(src):
        value = normalize(m.group(1))
        if not value or "${" in value:
            continue
        if value in alerts or value in placeholders or value in labels:
            continue
        if len(value) > 140:
            continue
        labels.append(value)

    buttons = []
    lines = src.splitlines()
    for i, line in enumerate(lines):
        if "TouchableOpacity" in line or "Pressable" in line:
            for j in range(i, min(i + 12, len(lines))):
                mt = re.search(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", lines[j])
                if mt:
                    value = normalize(mt.group(1))
                    if value and len(value) <= 90 and value not in buttons:
                        buttons.append(value)
                    break

    return {
        "alerts": alerts,
        "labels": labels,
        "buttons": buttons,
        "placeholders": placeholders,
    }


def main():
    data = json.loads(I18N.read_text(encoding="utf-8"))
    components_ads = data.setdefault("components", {}).setdefault("Ads", {})

    updated = 0
    for file in sorted(COMP_ADS.rglob("index.*")):
        if file.suffix.lower() not in {".ts", ".tsx", ".js", ".jsx"}:
            continue

        rel = file.relative_to(COMP_ADS).with_suffix("")
        parts = list(rel.parts[:-1])
        if not parts:
            parts = ["Home"]

        node = ensure_node(components_ads, parts)
        extracted = extract_from_file(file)
        for key, values in extracted.items():
            if values:
                node[key] = merge_unique(node.get(key, []), values)
                updated += 1

    I18N.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"UPDATED_COMPONENT_ADS_ENTRIES {updated}")


if __name__ == "__main__":
    main()
