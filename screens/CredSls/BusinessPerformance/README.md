# Business Performance Analytics

This document describes the business performance analytics currently implemented in MiFedha: transaction capture, branch and organization reporting, targets, manual entries, and location heat maps.

## Entry points

- On the Credit Sales screen, **View My Business Performance** opens the report.
- **Link Business Branches**, immediately after it, opens the organization linking flow.
- Both routes lead to `BusinessPerformance`; the second passes a navigation flag to open the linking dialog after the screen loads.

## Business and organization model

- A branch is a Bizna record, uniquely identified by `Bizna.BusKntct`.
- An organization is a `BusinessOrganization` record with a name and creator email.
- `Bizna.organizationId` is optional: unlinked branches continue to work as standalone businesses. Since it is a single field, a branch can point to at most one organization.
- The signed-in creator can create an organization by selecting at least two unlinked businesses created by their account. They can add unlinked businesses they created to an existing organization.
- A branch admin can view their branch report and the consolidated report for any organization containing a branch they administer. The organization creator can also view the organization report.
- Consolidated reports load analytics separately for each linked branch, then aggregate records for the selected date range. Individual branches remain identifiable in their records.
- Organization-level targets use `organizationId`; branch targets use `businessAccount`. These scopes are not conflated.

The UI branch selector checks the signed-in email against `Admin1` through `Admin50`. The creator's branch lookup uses the indexed Bizna creator `email` field.

## What is captured

`BusinessPerformanceRecord` stores a branch account key, `REVENUE` or `EXPENSE`, an amount, occurrence time, source, and optional item, quantity, fee, fulfillment, GPS, and description fields. For manual outside entries, `amountKes` contains the converted CHF value, `originalAmount` is the amount typed by the user, `currency` is the user's currency ISO code, and `exchangeRateToKes` contains the CHF-per-user-currency rate. The field names `amountKes` and `exchangeRateToKes` are legacy/misleading. Analytics records do not have a required base-currency field, and some transaction writers do not populate the optional `currency`; therefore, the schema does not guarantee that every automatically captured record is CHF. Audit each transaction writer and migrate fields/data before treating all historical records as currency-verified. Buyer names, email addresses, and contact details are not analytics fields.

| Flow | Seller revenue | Buyer-business expense | Location |
|---|---|---|---|
| Marketplace full payment, pickup | Recorded after successful purchase processing | Recorded when the buyer is a business | Uses available purchase location data |
| Completed partial payment | Recorded when the partial-pay transaction is completed | Recorded only for a business buyer | Uses available location data in the completion flow |
| NiSenti delivery | Recorded when the receiver completes delivery | Recorded only for a business buyer | Receiver GPS is attached when delivery is received |
| NiSenti cash, pickup | Recorded for the seller | Recorded when the buyer is a business | No individual buyer financial analytics |
| COMB settlement | Recorded for the seller | Recorded for the business buyer | No buyer identity is added to analytics |
| Activity outside NiSenti | Added manually as revenue or expense for the selected branch | N/A | Not captured by the manual form |

Individual buyers do not receive financial analytics records, but their available location can contribute to the seller's heat map. Cascaded payments are currently excluded.

Analytics writes are separate from the payment settlement flow. If a transaction completes but its analytics write fails, the transaction is not rolled back; the failure is logged and the relevant screen may report that analytics capture failed.

## Reports, charts, targets, and maps

- Performance-screen labels, chart controls, target forms, map navigation, and transaction/delivery analytics notices follow the app language in all 13 supported locales (`en`, `ar`, `zh`, `ru`, `sw`, `fr`, `es`, `de`, `pt`, `it`, `he`, `hi`, `am`).
- Choose a branch or organization and a `FROM` / `TO` date range.
- The screen refreshes analytics when it regains focus and again immediately before opening or downloading a report. When the selected end date is today, records are included only through the report request's current timestamp, not through the end of the day. The report UI and PDF show the local “Data through” time for that refreshed snapshot.
- Saving a manual outside revenue or expense writes the record to the backend and inserts the returned record into the current screen state, updating totals and charts without reloading the business list or refetching all analytics.
- The report shows revenue, expenses (including captured fees), and profit (`revenue - expenses`) converted from the app's assumed CHF base to the signed-in user's currency using the account exchange-rate pattern. Bar and line charts share `All`, `Revenue`, `Expenses`, and `Profit` selection; the map uses the same branch, date range, and measure selection. The line chart uses time on the x-axis and amount in the viewer's currency on the y-axis. Chart dates are grouped into consecutive intervals sized as `ceil(range days / 30)`, keeping the x-axis at no more than 30 sub-units; empty intervals are displayed as zero. Tap a chart point, bar, or date label to select its represented day or date interval. The selected date label highlights sky blue and shows an activity indicator while its values are calculated from the already-loaded records; a details dialog then shows exact revenue, expenses, and profit for that interval. The line chart and PDF include horizontal amount divisions and vertical date divisions to make values easier to estimate; PDF charts are static.
- **Download report** generates a PDF for the selected branch or organization and date range. It includes the report totals and matching transaction details, then opens the device share sheet so the user can save or share the file.
- The PDF includes the period bar and trend charts. Monthly CHF charges are calculated as `coveredMonths × performanceReadFee × CHF 1` for viewing and `coveredMonths × performanceDownloadFee × CHF 1` for downloading. The values come from the `Company` record's `performanceReadFee` and `performanceDownloadFee` fields (for example, `0.25` and `1` produce CHF 0.25 and CHF 1 per full month). Partial months are prorated by calendar days. Account debits and company-revenue credits use these CHF amounts directly; exchange rates are used only to display fee quotes and confirmations in the signed-in user's currency. Rates are fetched when the screen opens and whenever it regains focus, then rechecked before a debit; if they changed after the displayed quote, the charge is stopped so the user can review and reconfirm. Both rates must be set to non-negative numbers; unset or invalid settings disable paid report access rather than silently using hard-coded fees. Fees require confirmation before the report is opened or downloaded. For an organization, the user selects which branch pays. The selected Bizna's `earningsBal` and `netEarnings` are debited when its available balance covers the fee. Only when that business balance cannot cover the full fee is the user offered the option to charge their personal account's `SMAccount.balance`; the prompt states the exact local-currency amount and the charge proceeds only after separate approval. Collected fees are added to company revenue in CHF.
- Outside revenue and expenses can be entered for an individual branch, with an occurrence date and optional description, item, category, and quantity. The input label uses the signed-in user's currency. A valid exchange rate is required, and the amount is converted to CHF before being written; unavailable nationality/rates block the entry instead of silently storing an unconverted amount.
- Targets can be defined for profit, revenue, or expenses using a historical year, a fixed CHF amount, or a revenue-vs-expenses margin formula. The target has a calendar-selected start and end date and a daily, weekly, or monthly comparison interval.
- Customer-location maps are rendered locally from bundled boundary data; they do not depend on paid map tiles. The map supports two-finger pinch-to-zoom and on-screen zoom controls; enlarging the map expands its scrollable canvas. The initial world view colors country shapes by continent and shows GPS dots. All continents, countries, and available administrative subdivisions remain selectable even when they have no GPS records; their displayed GPS count is zero. Selecting a continent focuses the map on it and reveals all its countries; selecting a country reveals its available first-level subdivisions, then finer levels where bundled data exists. Clicking a map shape drills into the next level, and breadcrumbs allow moving back up. Global first-level boundaries include states, provinces, and other administrative divisions where Natural Earth provides them; Kenya includes counties and sub-counties. Countries without bundled finer boundaries remain at country level rather than showing a misleading subdivision. Administrative boundaries are neutral outlines, and each GPS record is shown at its coordinate as a dot; revenue and expense dots use separate colors. Locations are summarized without buyer identities. See [ATTRIBUTION.txt](../../../assets/geo/ATTRIBUTION.txt) for boundary-data credits and licensing.

## Code map

- Report, branch/organization selection, linking dialog, manual entries, and chart: [index.tsx](./index.tsx)
- Target creation, editing, date ranges, and target chart: [BusinessTargets.tsx](./BusinessTargets.tsx)
- Local heat-map presentation and geographic drill-down: [BusinessHeatmap.tsx](./BusinessHeatmap.tsx)
- Boundary loading, GPS point assignment, and region counts: [businessHeatmap.ts](../../../src/utils/businessHeatmap.ts)
- Shared analytics write validation: [businessPerformance.ts](../../../src/utils/businessPerformance.ts)
- GraphQL models, indexes, and authorization rules: [schema.graphql](../../../amplify/backend/api/mifedha1a/schema.graphql)
- GraphQL query and mutation documents: [queries.js](../../../src/graphql/queries.js), [mutations.js](../../../src/graphql/mutations.js)
- Credit Sales navigation and branch-linking shortcut: [CredSls/index.tsx](../index.tsx)
- Transaction capture: [SrchItemAd](../../Ads/Search/SrchItemAd/index.tsx), [PartialPayFlow](../../Ads/Search/PartialPayFlow/index.tsx), [ReceiveDelivery2](../../Transport/ReceiveDelivery2/index.tsx), [B2BPayCash](../PayCash/B2B/B2BPayCash/index.tsx), [PayCash2](../PayCash/P2B/PayCash2/index.tsx), and [FunderClearBill](../../COMB/FunderClearBill/index.tsx).

## Authorization and privacy notes

- The UI uses Bizna admin emails to decide which branch and organization options to show. UI filtering is not, on its own, a backend authorization boundary.
- In the current GraphQL schema, authenticated (`private`) users can read and create `BusinessPerformanceRecord` records. The record owner can read, update, and delete records where their `ownerSub` matches. Targets also allow authenticated users to create, read, update, and delete.
- `BusinessOrganization` creation and updates are owner-authorized against `createdByEmail` and the email identity claim. Organization metadata is readable by authenticated users. The `organizationId` field on Bizna is readable by authenticated users and updates are owner-authorized against the Bizna creator email.
- Before relying on analytics as confidential business data, review and tighten AppSync authorization so callers can only read/write records and targets for businesses they are authorized to administer. The current client-side business selection should not be treated as sufficient protection.
- GPS coordinates are sensitive location data even though buyer identity is not included. Collect and retain only what the product requires, and provide appropriate notice and controls.

## Not implemented yet

- A separate unique-buyer count. No buyer identity or stable anonymous buyer identifier is stored, so analytics cannot reliably deduplicate buyers across purchases.
- Automatic branch removal/unlinking, organization deletion workflows, and centralized feedback aggregation.
- Cascaded-payment analytics.
- Server-enforced, per-business authorization for performance records and targets.

## Build and deployment checks

The schema and generated GraphQL API changes must be deployed to the target Amplify environment before the organization and analytics API calls can work there. Schema compilation alone does not deploy them.

The `amountKes` and `exchangeRateToKes` field names do not accurately describe the CHF value used for manual entries, and the schema does not enforce a CHF record currency. Renaming or migrating them requires a coordinated schema and historical-data migration; until that is done, validate each source's amount units before relying on old records as currency-verified.

From the repository root in PowerShell:

```powershell
amplify api gql-compile
npx tsc --noEmit --skipLibCheck --jsx react-native --target ES2020 --moduleResolution node --module commonjs --esModuleInterop screens/CredSls/BusinessPerformance/index.tsx screens/CredSls/BusinessPerformance/BusinessTargets.tsx
```

Review `amplify status` and the generated changes for the intended environment before deploying. Do not deploy production changes without approval. The repository-wide TypeScript check may also report unrelated existing errors; use the focused command above to check these screens.
