# Script to fix ALL module-scope hooks in React/React Native components

$filesToFix = @(
    "components\Chama\BL\BLChmCovLn\index.tsx",
    "components\Chama\ChmActivities\ChmRemit\VwMember\index.tsx",
    "components\Chama\ChmActivities\Contributions\VwChama\index.tsx",
    "components\Chama\ChmActivities\Contributions\VwChama2\index.tsx",
    "components\Chama\ChmActivities\Contributions\VwMember\index.tsx",
    "components\Chama\ChmActivities\Membership\ChamaDtls\index.tsx",
    "components\Chama\ChmActivities\Membership\Member\index.tsx",
    "components\Chama\ChmActivities\Membership\MemberDtls\index.tsx",
    "components\Chama\ChmActivities\Membership\SelectChm2Ben\index.tsx",
    "components\Chama\LnReq\Vw2Confirm2\index.tsx",
    "components\Chama\LnReq\Vw2Confirm3\index.tsx",
    "components\Chama\LnReq\Vw2DelLnReq\index.tsx",
    "components\Chama\LnReq\Vw2GrantLnReqCov\index.tsx",
    "components\Chama\Loans\Givenout\Loanees\index.tsx",
    "components\Chama\Loans\Givenout\LoaneesDtls\index.tsx",
    "components\Chama\Loans\Received\Loaners\index.tsx",
    "components\Chama\Loans\Received\LoanersDtls\index.tsx",
    "components\Chama\RepayChmLn\RepyChmCovLn\index.tsx",
    "components\Chama\SyncGrpBenefits\index.tsx",
    "components\Chama\SyncGrpDeposits\index.tsx",
    "components\Chama\SyncGrpDividends\index.tsx",
    "components\Chama\SyncGrpLnRpymnt\index.tsx",
    "components\Chama\SyncGrpSubscription\index.tsx",
    "components\Chama\SyncGrpWithdrawal\index.tsx",
    "components\Chama\VwDepositsChm\index.tsx",
    "components\Chama\VwWithdrawalsChm\index.tsx",
    "components\CredSales\Ben Prods\ViewBenProds\index.tsx",
    "components\CredSales\BenProd2\ViewAsProdCreator\index.tsx",
    "components\CredSales\BenProd2\ViewBenContributions\index.tsx",
    "components\CredSales\BenProd2\ViewBenContributionsPal\index.tsx",
    "components\CredSales\BenProd2\ViewBenDtls\index.tsx",
    "components\CredSales\BenProd2\ViewBenProds\index.tsx",
    "components\CredSales\BenProd2\ViewBenToShare\index.tsx",
    "components\CredSales\BenProd2\ViewBizBenefactorShares\index.tsx",
    "components\CredSales\BenProd2\ViewBizBenefactorSharesPal\index.tsx",
    "components\CredSales\BenProd2\ViewBizBeneficiaryShares\index.tsx",
    "components\CredSales\BenProd2\ViewMyBeneficiaryShares\index.tsx",
    "components\CredSales\BenProd2\ViewPalBeneficiaryShares\index.tsx",
    "components\CredSales\BenProd2\VwProdCreatorContrDtls\index.tsx",
    "components\CredSales\PayCash\BenProds\ViewBenProds\index.tsx",
    "components\CredSales\PayCash\Biz2Pal\Vw2GrantB2P\index.tsx",
    "components\Loans\LoanStts\CovLons\Loanee\index.tsx",
    "components\Loans\LoanStts\P2PLoanee\index.tsx",
    "components\VwCredSales\Cov\Loaners\index.tsx",
    "components\VwCredSales\Vw2Grant\Biz2Pal\index.tsx"
)

Write-Host "🔧 Hook Violation Fixer - Processing $($filesToFix.Count) files" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$fixedCount = 0
$skippedCount = 0

foreach ($file in $filesToFix) {
    $fullPath = Join-Path "c:\Users\USER\mifedha1a18" $file
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "⚠️  SKIP: $file (not found)" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    $content = Get-Content $fullPath -Raw
    
    # Check if file needs fixing (has module-scope hooks)
    if ($content -match "^const \[.*\] = useState|^useEffect\(") {
        Write-Host "✅ DETECTED: $file" -ForegroundColor Green
        $fixedCount++
    } else {
        Write-Host "⏭️  SKIP: $file (no violations)" -ForegroundColor Gray
        $skippedCount++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Files needing fixes: $fixedCount" -ForegroundColor Green
Write-Host "   Files skipped: $skippedCount" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  These files need MANUAL refactoring to move hooks inside component functions" -ForegroundColor Yellow
