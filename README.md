# Juu full-payment event integration

This repository reports completed full-payment marketplace purchases to Juu. The checkout and account-balance updates remain in the app's existing transaction flow; Juu receives a performance event after those updates succeed. Juu is **not** used to authorize or move the purchase funds.

This distinction keeps the purchase flow usable if event reporting is temporarily unavailable: a completed purchase is not rolled back just because Juu did not accept its event.

## How the integration works

1. **The buyer chooses the full-payment flow.** The marketplace offers “Pay Full Amount” and routes partial payments separately. Full-payment ads are loaded with the `purchaseType: PayFull` filter.
2. **The app completes its normal checkout.** The checkout handlers validate and calculate the purchase, record marketplace consumption, update seller and buyer account data, and create the transaction records. Both full-payment checkout paths call the Juu reporter only after their purchase updates finish.
3. **The app gathers and checks event data.** `reportJuuFullPayment` requests the buyer's current location, checks that latitude and longitude are finite and in range, and sends the amount in KES with those coordinates. The amount is the item-cost total, not the buyer's total debit including marketplace fees.
4. **AppSync forwards the request to a Lambda.** The `recordJuuFullPaymentEvent` mutation defines the amount, location input, and response in the GraphQL schema. Its function resolver invokes `mifedhaJuuFullPayment`.
5. **The Lambda validates and builds Juu's event.** It requires an authenticated caller, a positive amount, valid coordinates, a configured product ID, and an integration secret. It creates a unique event ID and timestamp, then sends contract version 6 to Juu as `nisenti_full_payment_online_purchase`.
6. **Juu's response is handled separately from checkout.** An HTTP 202 is treated as acceptance. Rejections and delivery errors are logged and returned as a failed event result. The app reports that tracking failed while leaving the already-completed purchase intact.

## Code map

- Marketplace selection, checkout, GPS collection, and client-side failure messaging: [screens/Ads/Search/SrchItemAd/index.tsx](screens/Ads/Search/SrchItemAd/index.tsx)
- Group application approval, group creation, saved group location, and Juu registration-event reporting: [screens/Chama/CrtChm/index.tsx](screens/Chama/CrtChm/index.tsx)
- GraphQL mutation used by the app: [src/graphql/mutations.js](src/graphql/mutations.js)
- Mutation resolver and event input/response types: [amplify/backend/api/mifedha1a/schema.graphql](amplify/backend/api/mifedha1a/schema.graphql)
- Juu request construction, validation, secret retrieval, and response handling: [amplify/backend/function/mifedhaJuuFullPayment/src/index.js](amplify/backend/function/mifedhaJuuFullPayment/src/index.js)
- Lambda configuration for the product ID and secret name: [amplify/backend/function/mifedhaJuuFullPayment/function-parameters.json](amplify/backend/function/mifedhaJuuFullPayment/function-parameters.json)
- Amplify deployment notes: [amplify/README.md](amplify/README.md)

## Adapting this pattern for another business

1. **Agree on the event contract with the destination service.** Define what counts as a completed sale, the event name and schema, required identifiers, the amount and currency, location requirements, and the success response. Do not report a purchase attempt as a completed sale.
2. **Choose the correct point in the transaction lifecycle.** Invoke the reporter only after the business's own purchase records and balance changes succeed. Keep event delivery outside the logic that authorizes or settles payment unless the destination is explicitly the payment provider.
3. **Add a narrow API boundary.** Expose a mutation or endpoint with typed inputs and a small success/message response. Have the server verify caller identity and validate all values; never trust the client to provide a valid amount or location.
4. **Keep credentials on the server.** Put the destination's integration key in a managed secret store such as AWS Systems Manager Parameter Store, grant the function only the access it needs, and inject the product/account identifier through environment-specific configuration. Never ship API keys in the mobile or web app, commit them, or include them in logs.
5. **Build the destination payload server-side.** Include the agreed contract version, a unique event ID, an occurrence timestamp, the configured product/account ID, and only the fields the destination requires. Make units explicit (for example, KES) and validate coordinates if location is required.
6. **Handle failures without corrupting completed sales.** Apply a bounded network timeout, distinguish acceptance from rejection, redact secrets in logs, and return an explicit failure result. Decide with the business whether to retry or queue failed events; this implementation reports failure but does not retry automatically.
7. **Configure and deploy each environment deliberately.** Set the destination product/account ID and secret for the target environment, review the Amplify changes, and deploy. Keep development and production credentials separate.
8. **Verify both outcomes before release.** Complete a test purchase with location permission enabled and verify the destination receives the expected event, amount, currency, and coordinates. Also test missing location, invalid input, missing configuration, and a destination rejection; confirm that event failures are visible and do not undo a successful purchase.

## Juu deployment prerequisites

For this implementation, configure `JUU_PRODUCT_ID` and the `JuuIntegrationKey` secret for the target Amplify environment before deploying. Amplify stores the secret as an encrypted SSM value; do not place it in app configuration or source control. See [amplify/README.md](amplify/README.md) for the environment setup steps.

The `nisenti` environment also reports successful chama registrations as `kenyan_self_help_groups` using contract version 7 and the `number_of_groups` field. It uses the Kenyan Self Help Groups product ID and reuses the Lambda's existing `JuuIntegrationKey`; deployment details are in [amplify/README.md](amplify/README.md).
