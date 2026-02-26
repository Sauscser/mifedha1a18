import re, json
from pathlib import Path

root = Path(r"c:/Users/USER/mifedha1a18")
base = root / "screens" / "CredSls"
outfile = root / "scripts" / "cred_targets_extract.json"

requested = [
    "BiznaReqPage2","DissolveBiz","ElimCredCvLnee","ElimCrdCvLnr","giveBizna","PersonelVw2GrntLR","RmvPersonnel",
    "SgnIn2TransferBiz","SgnIn2VwBizna","SgnIn2VwCashSales","SgnIn2VwCovCrdSlsLnees","SgnIn2VwRevenueShare","SignIn2GrntCrdSls",
    "SI2ReqLoans/Biz2Biz","SI2ReqLoans/Biz2Pal","Vw2DelLnReqs","Vw2DelLnReq2","Vw2Grant/Biz2Biz","Vw2Grant/Biz2Pal",
    "Vw2Grant/Pal2Biz","Vw2Grant/Pal2Pal","Vw2GrantLnReqCov2","SnIn2VwCrdSlLP","TakeOverBizna","UpdateBizAc",
    "ViewBiznaShareRec","ViewBiznaShareRecBiz","ViewBiznaShareSent","ViewBiznaShareSentPal","ViewRPymnts","Vw2GrntCrdSls",
    "VwBusAc","VwBusAc2TakeUp","VwCashPayRec","VwCashPaySent","VwLoanStts"
]


def find_path(token: str):
    direct = base / token / "index.tsx"
    if direct.exists():
        return direct
    last = token.split("/")[-1]
    candidates = []
    for p in base.rglob("index.tsx"):
        rel = p.relative_to(base).as_posix()
        if rel.endswith(f"{token}/index.tsx"):
            return p
        if rel.endswith(f"{last}/index.tsx"):
            candidates.append(p)
    return candidates[0] if candidates else None

pat_alert = re.compile(r"Alert\.alert\(\s*(['\"])(.*?)\1(?:\s*,\s*(['\"])(.*?)\3)?", re.S)
pat_ph = re.compile(r"placeholder\s*=\s*([\"'])(.*?)\1", re.S)
pat_text = re.compile(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", re.S)

result = {}
missing = []

for token in requested:
    p = find_path(token)
    if not p:
        missing.append(token)
        continue

    src = p.read_text(encoding="utf-8", errors="ignore")

    alerts = []
    for m in pat_alert.finditer(src):
        first = (m.group(2) or "").strip()
        second = (m.group(4) or "").strip()
        if first and "${" not in first and first not in alerts:
            alerts.append(first)
        if second and "${" not in second and second not in alerts:
            alerts.append(second)

    labels = []
    for m in pat_ph.finditer(src):
        value = m.group(2).strip()
        if value and value not in labels:
            labels.append(value)

    buttons = []
    lines = src.splitlines()
    for i, line in enumerate(lines):
        if "Pressable" in line or "TouchableOpacity" in line:
            for j in range(i, min(i + 9, len(lines))):
                mt = re.search(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", lines[j])
                if mt:
                    value = mt.group(1).strip()
                    if value and len(value) < 60 and value not in buttons:
                        buttons.append(value)
                    break

    text_labels = []
    for m in pat_text.finditer(src):
        value = " ".join((m.group(1) or "").split())
        if not value or "${" in value:
            continue
        if value in labels or value in alerts or value in buttons:
            continue
        if len(value) > 90:
            continue
        if value not in text_labels:
            text_labels.append(value)

    rel = p.relative_to(base).as_posix().replace("/index.tsx", "")
    result[rel] = {
        "alerts": alerts,
        "labels": labels + [v for v in text_labels if v not in labels],
        "buttons": buttons,
        "file": str(p.relative_to(root).as_posix())
    }

outfile.write_text(json.dumps({"found": result, "missing": missing}, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"WROTE {outfile}")
print(f"FOUND {len(result)}")
print(f"MISSING {len(missing)}")
if missing:
    print("MISSING_LIST:", ", ".join(missing))