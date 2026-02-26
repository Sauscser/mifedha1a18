import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MYACC = ROOT / "screens" / "MyAcc"
I18N = ROOT / "i18n-strings-collection.json"

MISSING_PATHS = [
    "Loans/RepayLoan/AutomaticRepay/AllTyps",
    "Loans/RepayLoan/AutomaticRepay",
    "Loans/LRpyments/B2PReceived",
    "Loans/LRpyments/B2PSent",
    "Loans/BList/CredLoanee/SgnInToBL/CredSlCov",
    "Loans/BList/CredLoanee/SgnInToBL/CredSlNonCov",
    "DeActivtUsr",
    "DeActivtUsr/DeactivateMFNdogo",
    "DepositMny/DepositOptions",
    "Loans/ViewCredSls/Cov/Loanees",
    "Loans/ViewCredSls/NonCov/Loanees",
    "DepositMny/Mpesa",
    "Loans/ViewSMLns/Biz2Pal/MyLoanees",
    "Loans/ViewSMLns/Cov/MyLoanees",
    "Loans/ViewSMLns/NonCov/MyLoanees",
    "Loans/ViewSMLns/Pal2Pal/MyLoanees",
    "Loans/ViewSMLns/Biz2Pal/MyLoaneesDtld",
    "Loans/ViewSMLns/Pal2Pal/MyLoaneesDtld",
    "Loans/LRpyments/P2PReceived",
    "DepositMny/PayPalDposit",
    "DepositMny/PaystackPayment",
    "DepositMny/PaystackTNC",
    "DepositMny/ReadPayPalTNC",
    "Loans/BList/SMLoanee/SgnInToBL/SMCov",
    "Loans/BList/SMLoanee/SgnInToBL/SMNonCov",
    "Loans/BList/CredLoanee/SgnInToBL",
    "Loans/BList/SMLoanee/SgnInToBL",
    "Loans/LRpyments/SignIn2VwLR",
    "DepositMny/UpdatePayStack",
    "Loans/BList/View2BL",
    "Loans/RepayLoan/SM/Vw2Repay",
    "DepositMny/VwAcBfDpst",
    "DepositMny/VwSMDpsts",
    "CreateAc/__tests__",
]

RE_ALERT = re.compile(r"Alert\.alert\(\s*([\"'])(.*?)\1(?:\s*,\s*([\"'])(.*?)\3)?", re.S)
RE_PLACEHOLDER = re.compile(r"placeholder\s*=\s*([\"'])(.*?)\1", re.S)
RE_TEXT = re.compile(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", re.S)


def normalize(text: str) -> str:
    return " ".join((text or "").split()).strip()


def extract_from_file(path: Path):
    src = path.read_text(encoding="utf-8", errors="ignore")
    alerts = []
    for match in RE_ALERT.finditer(src):
        first = normalize(match.group(2))
        second = normalize(match.group(4))
        if first and "${" not in first and first not in alerts:
            alerts.append(first)
        if second and "${" not in second and second not in alerts:
            alerts.append(second)

    placeholders = []
    for match in RE_PLACEHOLDER.finditer(src):
        value = normalize(match.group(2))
        if value and value not in placeholders:
            placeholders.append(value)

    labels = []
    for match in RE_TEXT.finditer(src):
        value = normalize(match.group(1))
        if not value or "${" in value:
            continue
        if value in alerts or value in placeholders or value in labels:
            continue
        if len(value) > 100:
            continue
        labels.append(value)

    buttons = []
    lines = src.splitlines()
    for index, line in enumerate(lines):
        if "TouchableOpacity" in line or "Pressable" in line:
            for offset in range(index, min(index + 10, len(lines))):
                found = re.search(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", lines[offset])
                if found:
                    value = normalize(found.group(1))
                    if value and value not in buttons and len(value) <= 80:
                        buttons.append(value)
                    break

    return {
        "alerts": alerts,
        "labels": labels,
        "buttons": buttons,
        "placeholders": placeholders,
    }


def merge_unique(existing, incoming):
    merged = list(existing or [])
    for item in incoming or []:
        if item not in merged:
            merged.append(item)
    return merged


def ensure_node(base, path_parts):
    node = base
    for part in path_parts:
        node = node.setdefault(part, {})
    return node


data = json.loads(I18N.read_text(encoding="utf-8"))
myacc = data.setdefault("screens", {}).setdefault("MyAcc", {})

updated = 0
for relative in MISSING_PATHS:
    folder = MYACC / relative
    if not folder.exists():
        continue

    extracted = {"alerts": [], "labels": [], "buttons": [], "placeholders": []}
    for file in sorted(folder.rglob("*")):
        if file.suffix.lower() not in {".ts", ".tsx", ".js", ".jsx"}:
            continue
        values = extract_from_file(file)
        for key in extracted.keys():
            extracted[key] = merge_unique(extracted[key], values[key])

    parts = relative.split("/")
    node = ensure_node(myacc, parts)
    for key, values in extracted.items():
        if values:
            node[key] = merge_unique(node.get(key, []), values)
    updated += 1

I18N.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"UPDATED_PATHS {updated}")
