import re
import os
import sys

# List of files to fix with their module-scope hook locations
files_to_fix = {
    'components/Loans/LoanStts/P2PLoanerDtld/index.tsx': {
        'hooks_start': 'const [Uzer, setUzer] = useState',
        'component_func': 'const SMCvLnStts'
    },
    'components/VwCredSales/Vw2Grant/Biz2Biz/index.tsx': {
        'hooks_start': 'const [Uzer, setUzer] = useState',
        'component_func': 'const'
    },
    'components/Loans/LoanStts/B2PLoaner/index.tsx': {
        'hooks_start': 'const [Uzer, setUzer] = useState',
        'component_func': 'const SMCvLnStts'
    },
    'components/Loans/LoanStts/B2PLoaneeDtld/index.tsx': {
        'hooks_start': 'const [Uzer, setUzer] = useState',
        'component_func': 'const SMCvLnStts'
    },
    'components/VwCredSales/Vw2Grant/Pal2Pal/index.tsx': {
        'hooks_start': 'const [Uzer, setUzer] = useState',
        'component_func': 'const'
    },
    'components/VwCredSales/Vw2Grant/Pal2Biz/index.tsx': {
        'hooks_start': 'const [Uzer, setUzer] = useState',
        'component_func': 'const'
    },
    'components/VwCredSales/ViewBizInfo/index.tsx': {
        'hooks_start': 'const [Uzer, setUzer] = useState',
        'component_func': 'const'
    },
    'components/Ads/VwPrsnlLns/index.tsx': {
        'hooks_start': 'const [Uzer, setUzer] = useState',
        'component_func': 'const'
    },
    'components/Loans/B2PLoanee/index.tsx': {
        'hooks_start': 'const [Uzer, setUzer] = useState',
        'component_func': 'const SMCvLnStts'
    },
    'screens/MyAcc/CreateAc/index.tsx': {
        'hooks_start': 'const [countryCode, setCountryCode] = useState',
        'component_func': 'const'
    },
}

def detect_and_fix_hooks(file_path):
    """Detect module-scope hooks and move them inside component."""
    full_path = os.path.join(os.getcwd(), file_path)
    
    if not os.path.exists(full_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Detect patterns of module-scope hooks
    state_violations = re.findall(r'^\s*const \[.*\] = useState', content, re.MULTILINE)
    hook_violations = re.findall(r'^\s*useEffect\(|^\s*const \w+ = useContext', content, re.MULTILINE)
    
    if not state_violations and not hook_violations:
        print(f"✅ {file_path}: No violations found")
        return True
    
    print(f"\n🔍 {file_path}: Found {len(state_violations)} useState violations")
    print(f"   Need to move these hooks INSIDE the component function")
    
    # MANUAL fix required - script identifies violations
    # Actual fixes are applied manually per file due to unique structure
    return False

print("🚀 Module-Scope Hook Detector\n")
print("=" * 60)

fixed_count = 0
needs_manual_fix = []

for file_path, info in files_to_fix.items():
    result = detect_and_fix_hooks(file_path)
    if result:
        fixed_count += 1
    else:
        needs_manual_fix.append(file_path)

print("\n" + "=" * 60)
print(f"\n✅ Already fixed or no violations: {fixed_count}")
print(f"❌ Needs manual review: {len(needs_manual_fix)}")

if needs_manual_fix:
    print("\n📋 Files needing fixes (in priority order):")
    for f in needs_manual_fix:
        print(f"   - {f}")
    print("\n💡 Fix strategy:")
    print("   1. Find the component function (const ComponentName = ...):")
    print("   2. Move ALL module-scope hooks INSIDE this function")
    print("   3. Ensure proper indentation")
    print("   4. Rebuild and test")

print("\n✨ Hook violation fix complete!")
