import re, json
from pathlib import Path

root = Path(r"c:/Users/USER/mifedha1a18")
base = root / "screens" / "CredSls"
outfile = root / "scripts" / "cred_recursive_extract.json"

requested = [
"BiznaReqPage2", "DissolveBiz", "ElimCredCvLnee", "ElimCrdCvLnr", "giveBizna", "PersonelVw2GrntLR", "RmvPersonnel",
"SgnIn2TransferBiz", "SgnIn2VwBizna", "SgnIn2VwCashSales", "SgnIn2VwCovCrdSlsLnees", "SgnIn2VwRevenueShare", "SignIn2GrntCrdSls",
"SI2ReqLoans/Biz2Biz", "SI2ReqLoans/Biz2Pal", "Vw2DelLnReqs", "Vw2DelLnReq2", "Vw2Grant/Biz2Biz", "Vw2Grant/Biz2Pal",
"Vw2Grant/Pal2Biz", "Vw2Grant/Pal2Pal", "Vw2GrantLnReqCov2", "SnIn2VwCrdSlLP", "TakeOverBizna", "UpdateBizAc",
"ViewBiznaShareRec", "ViewBiznaShareRecBiz", "ViewBiznaShareSent", "ViewBiznaShareSentPal", "ViewRPymnts", "Vw2GrntCrdSls",
"VwBusAc", "VwBusAc2TakeUp", "VwCashPayRec", "VwCashPaySent", "VwLoanStts"
]

# known typo mappings
map_token = {
    "BiznaReqPage2": "BiznaReqstPage2",
    "ElimCrdCvLnr": "ElimCredCvLnr",
    "SignIn2GrntCrdSls": "SignIn2GrntCrdSls",
    "SI2ReqLoans/Biz2Biz": "SlsLnReq/SI2ReqLoans/Biz2Biz",
    "SI2ReqLoans/Biz2Pal": "SlsLnReq/SI2ReqLoans/Biz2Pal",
    "Vw2DelLnReqs": "SlsLnReq/Vw2DelLnReqs",
    "Vw2DelLnReq2": "SlsLnReq/Vw2DelLnReqs2",
    "Vw2Grant/Biz2Biz": "SlsLnReq/Vw2Grant/Biz2Biz",
    "Vw2Grant/Biz2Pal": "SlsLnReq/Vw2Grant/Biz2Pal",
    "Vw2Grant/Pal2Biz": "SlsLnReq/Vw2Grant/Pal2Biz",
    "Vw2Grant/Pal2Pal": "SlsLnReq/Vw2Grant/Pal2Pal",
    "Vw2GrantLnReqCov2": "SlsLnReq/Vw2GrantLnReqCov2",
    "ViewBiznaShareSentPal": "ViewBiznaShareSent2Pal",
}

pat_alert = re.compile(r"Alert\.alert\(\s*(['\"])(.*?)\1(?:\s*,\s*(['\"])(.*?)\3)?", re.S)
pat_ph = re.compile(r"placeholder\s*=\s*([\"'])(.*?)\1", re.S)
pat_text = re.compile(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", re.S)


def extract_from_file(p: Path):
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
        t = m.group(2).strip()
        if t and t not in labels:
            labels.append(t)

    buttons = []
    lines = src.splitlines()
    for i, line in enumerate(lines):
        if "Pressable" in line or "TouchableOpacity" in line:
            for j in range(i, min(i + 9, len(lines))):
                mt = re.search(r"<Text[^>]*>\s*([^<{][^<]*?)\s*</Text>", lines[j])
                if mt:
                    t = mt.group(1).strip()
                    if t and len(t) < 60 and t not in buttons:
                        buttons.append(t)
                    break

    text_labels = []
    for m in pat_text.finditer(src):
        t = " ".join((m.group(1) or "").split())
        if not t or "${" in t:
            continue
        if t in alerts or t in labels or t in buttons:
            continue
        if len(t) > 90:
            continue
        if t not in text_labels:
            text_labels.append(t)

    all_labels = labels + [t for t in text_labels if t not in labels]
    return {
        "alerts": alerts,
        "labels": all_labels,
        "buttons": buttons,
    }

found = {}
missing = []
for token in requested:
    mapped = map_token.get(token, token)
    folder = base / mapped
    if not folder.exists():
        missing.append(token)
        continue

    files = sorted(folder.rglob("index.tsx"))
    if not files:
        missing.append(token)
        continue

    for f in files:
        rel = f.relative_to(base).as_posix().replace('/index.tsx','')
        extracted = extract_from_file(f)
        if extracted["alerts"] or extracted["labels"] or extracted["buttons"]:
            found[rel] = extracted

outfile.write_text(json.dumps({"found": found, "missing": missing}, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"WROTE {outfile}")
print(f"FOUND {len(found)} files")
print(f"MISSING {len(missing)} roots")
if missing:
    print('MISSING:', ', '.join(missing))