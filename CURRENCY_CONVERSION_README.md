# Currency Conversion Guide

## Canonical money unit

The backend stores monetary values in Swiss francs (CHF). Treat CHF as the
canonical unit for GraphQL money fields, persisted balances, and server-side
financial arithmetic. A field named `amount`, `balance`, or `defaultPenalty`
does not imply that its value is in the viewer's local currency.

Use unit-specific names such as `amountCHF`, `installmentCHF`, and
`penaltyCHF` for values that are ready to persist. Use names such as
`amountUserCurrency` for values read from a local-currency input.

## Exchange-rate direction

Exchange rates in `ExRates` express **foreign-currency units per 1 CHF**:

- `buyingPrice`: foreign-currency units received for 1 CHF when displaying CHF
  to a user.
- `sellingPrice`: foreign-currency units required to acquire 1 CHF when
  converting a user's input back to the backend unit.

For a rate row whose symbol is EUR, for example, both prices describe EUR per
CHF; use the actual row values rather than assuming an example rate.

### CHF to a user's currency (presentation)

```text
amountUserCurrency = amountCHF * buyingPrice
```

Use `formatAmountSync(amountCHF, userCountryCode, ratesMap)` when the exchange
rate map is already loaded. For a screen that needs the same fallback behavior
as `components/MyAc/ViewAc/index.tsx`:

1. Resolve the person's country code and currency key.
2. Resolve a matching rate-map key (country code, country name, or currency
   ISO code).
3. If the map has no matching rate, load it with
   `getExRatesForNationality(nationality)`.
4. Multiply CHF by `buyingPrice` and display the returned currency symbol.

Use the **viewer's** currency for screen labels, amounts, alerts, and dialogs.
For a notification addressed to another person, use the recipient's currency.
Never use the loan applicant's or another account's currency for the current
viewer's screen unless the UI explicitly identifies that amount as theirs.

Format all user-facing money consistently, including alerts, confirmation
dialogs, notifications, and calculated summaries. Do not send a formatted
string back to a mutation.

### A user's currency to CHF (input and persistence)

```text
amountCHF = amountUserCurrency / sellingPrice
```

Use `convertUserCurrencyToCHF(amountUserCurrency, nationality)` for new code.
It requires a valid rate and rejects missing or invalid rates instead of
silently returning an unconverted amount. Convert entered monetary values once,
then use CHF values for calculations, comparisons, balance updates, and
GraphQL writes:

```ts
const principalCHF = await convertUserCurrencyToCHF(
  parseAmountInput(principalInput),
  userCountryCode
);
const penaltyCHF = await convertUserCurrencyToCHF(
  parseAmountInput(penaltyInput),
  userCountryCode
);

// Perform financial calculations with CHF values.
// Persist CHF values; do not convert them again.
```

Every monetary `TextInput` should make the input currency clear, preferably
with the user's currency symbol/code beside the field and in its helper or
placeholder text. Read the user's nationality from their account, resolve it
with `nationalityToCode`, and use the matching exchange-rate entry for that
currency cue.

If existing code performs calculations using user-currency inputs, convert
each monetary value to CHF before the backend write. Do not mix values in
different currencies in the same arithmetic operation. If two same-currency
inputs must be compared before conversion for legacy UI behavior, keep that
calculation local to presentation and convert every persisted monetary value
to CHF before saving.

## Helpers and legacy names

Use these explicitly named helpers for new work:

- `convertCHFToUserCurrency(amountCHF, nationality)` for numeric display
  conversions. It rejects missing or invalid rates.
- `convertUserCurrencyToCHF(amountUserCurrency, nationality)` for user input
  and persistence. It rejects missing or invalid rates.
- `formatAmountSync(amountCHF, countryOrCurrencyKey, ratesMap)` for formatted
  CHF amounts in the UI when rates are already loaded.
- `getExRatesForNationality(nationality)` to load a rate when needed.

The older exports `convertKshToUserCurrency` and `convertForeignToKsh` are kept
for compatibility with existing screens. Despite their names, the app's base
currency is CHF; the latter returns CHF, not KES, and the legacy helpers can
fall back to the original amount when a rate is unavailable. Avoid them for new
backend writes, since that fallback can persist a local-currency value as if
it were CHF.

## Checklist for currency-sensitive changes

- [ ] Identify the currency of every input, fetched amount, calculation, and
  backend field.
- [ ] Label each value with a unit in its variable name.
- [ ] Show the user's currency beside local-currency inputs.
- [ ] Convert user inputs to CHF before financial arithmetic where practical.
- [ ] Keep persisted amounts and balance updates in CHF; never convert a CHF
  value twice.
- [ ] Convert CHF to the viewer's currency only at the UI boundary.
- [ ] Use the notification recipient's currency for money in their message.
- [ ] Handle unavailable or invalid rates explicitly before saving money.
- [ ] Verify GraphQL mutations receive numeric CHF values, not formatted
  strings or local-currency amounts.
