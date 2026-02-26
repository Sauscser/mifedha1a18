import json
from pathlib import Path
root = Path(r'c:/Users/USER/mifedha1a18')
src = root/'scripts'/'cred_recursive_extract.json'
out = root/'scripts'/'cred_batch2_block.txt'
obj = json.loads(src.read_text(encoding='utf-8'))['found']
block = json.dumps({"Batch2RequestedScreens": obj}, indent=8, ensure_ascii=False)
out.write_text(block, encoding='utf-8')
print('WROTE', out)
print('LINES', len(block.splitlines()))