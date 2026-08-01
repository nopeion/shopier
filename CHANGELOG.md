# Changelog

All notable changes to `@nopeion/shopier` are documented in this file. Releases should also be mirrored in GitHub Releases.

## [Unreleased]

## [2.2.0] - 2026-08-01

### Added

- `safeJsonParse` and `safeJsonReviver` utilities in `src/utils/safe-json.ts` to provide native prototype pollution protection when parsing external JSON payloads.

### Security

- **Prototype Pollution Prevention:** Replaced standard `JSON.parse` with a hardened `safeJsonParse` reviver for processing OSB and REST Webhook payloads. This mitigates JSON-based prototype pollution vectors by aggressively filtering `__proto__`, `constructor`, and `prototype` keys during ingestion.

### Changed

- **Architecture Deconstruction:** The monolithic `api.ts` file has been cleanly split into a modular directory structure (`src/api/client.ts`, `src/api/types.ts`, `src/api/index.ts`), significantly reducing single-file complexity while strictly maintaining external export interfaces for zero-breakage backward compatibility.
- **Performance Optimization:** Refactored the `ShopierPaymentFlow.cleanupProducts` method to utilize asynchronous execution. Sequential looping was replaced by `Promise.all` mapping combined with a 5-item batch chunking strategy to maximize throughput while avoiding API rate limits.

### Fixed

- Corrected the published `@nopeion/shopier/api` subpath to resolve to the generated `dist/api/index` entrypoints in both CommonJS and ESM builds.

## [2.1.0] - 2026-07-30

### Added

- Automatic retries in `ShopierApiClient` for transient failures: HTTP 408, 429, 500, 502, 503, 504, timeouts, and network errors. Backoff is exponential with jitter and honours a `Retry-After` header when Shopier sends one.
- `retry` options on both the client config and individual requests: `maxRetries`, `baseDelayMs`, `maxDelayMs`, `retryNonIdempotent`, `shouldRetry`, and `onRetry`. Exported as `ShopierRetryOptions`, `ShopierRetryContext`, and `ShopierFailureReason`.
- `error.details.reason` on API errors, distinguishing `http`, `timeout`, `aborted`, and `network` failures.
- `idempotencyKey` option: every `create` method (`refunds.create`, `products.create`, `categories.create`, and so on, plus the `createRefund`/`createProduct`/`createWebhook` convenience methods) accepts a second `{ idempotencyKey }` argument, sent as the `Idempotency-Key` header. `createIdempotencyKey()` generates one. Exported as `ShopierCreateOptions`. **Does not affect retry behaviour** — see Fixed, below.
- `orders.list()` now throws a `ValidationError` immediately when both `dateStart` and `dateEnd` are omitted, instead of silently sending a request Shopier answers with an empty array. **Breaking for any caller relying on that empty-array response** — pass at least one of `dateStart`/`dateEnd` (`YYYY-MM-DDTHH:mm:ssZ`). Scoped to `orders.list()` only; other date-ranged list endpoints (`payouts`, `refunds`, `products`, `balance.transactions`) are unguarded, since this was only confirmed live for orders.

### Fixed

- `client.variations.list()` now forwards its pagination parameters. The method accepted `limit`, `page`, and `sort` in its type signature but silently discarded them.

- A caller-supplied `AbortSignal` no longer leaks one listener per request, and cancelling now reports `Shopier API request was aborted` instead of misreporting a timeout.

- **Safety fix:** supplying `idempotencyKey` no longer makes a POST eligible for retry on its own. It shipped that way under the assumption that Shopier deduplicates requests carrying an `Idempotency-Key` header; tested live, it does not — two identical `products.create()` calls with the same key created two separate products. Retrying a POST on the strength of a key alone could have created duplicate resources (a second refund, a second product) while looking safe. `retry: { retryNonIdempotent: true }` is now the only way to retry a POST, unchanged in risk from before this feature existed.

### Changed

- `npm test` now runs with coverage and enforces the thresholds, so a coverage regression fails CI instead of passing unnoticed.
- Requests are retried by default (`maxRetries: 2`). Idempotent calls that previously failed on a transient error now succeed after a short wait. Set `retry: { maxRetries: 0 }` to restore the old single-attempt behaviour. POST is not retried unless you opt in.

### Documentation

- Documented that `refunds.create()` can respond with a 500 even when Shopier actually started processing the refund, with the pending refund invisible from both `orders.get()` and `refunds.list()` until it resolves — confirmed live: a failed-looking create call left the dashboard showing "refund processing" that neither read endpoint reported.

### Removed

- Deleted the source files behind the classic checkout API that 2.0.0 already dropped from the public exports: `Shopier`, `ConfigManager`/`resolveConfig`, `validateConfig`/`validateBuyer`/`validateAmount`/`validateEmail`/`validatePhone`/`validateInstallment`, `resolveCheckoutCredentials`/`ShopierCheckoutCredentials`, `InvalidApiKeyError`/`InvalidApiSecretError`, the classic form renderers, the singular `webhook.ts`, and the `enums`/`types` modules that only they used. None of this was reachable from `@nopeion/shopier`'s exports or included in the published build; it was unused source left over from the 2.0.0 migration. `SHOPIER_API_KEY` and `SHOPIER_API_SECRET` were only ever read by this dead code — they have done nothing since 2.0.0. Use `SHOPIER_PAT` with `ShopierApiClient` instead; see [the v2 migration guide](./docs/migration-v2.md).

### Migration

- `orders.list()` now throws a `ValidationError` if you call it without `dateStart` or `dateEnd`. If you were calling it with neither, add at least one — Shopier was already returning an empty array in that case, so nothing you were relying on could have depended on the old behaviour succeeding with real data.

### Internal

- Full test coverage for the PAT REST API client: every documented endpoint, credential and base URL resolution, query serialization, path parameter encoding, response decoding, error mapping, timeouts, and cancellation.

## [2.0.0] - 2026-06-19

### Added

- PAT REST API coverage for balances, categories, discounts, orders, payouts, products, refunds, selections, shippings, shop settings, variations, and webhook subscriptions.
- PAT hosted-checkout helpers, payment lifecycle helpers, diagnostics, framework adapters, test fixtures, and OSB helpers.
- REST webhook HMAC verification, typed event parsing, and routing helpers.
- A separate public `shopier-playground` companion repository.

### Changed

- Documentation, examples, and security guidance now use PAT checkout, REST webhooks, and OSB only.
- The build clears stale output before packaging.
- The supported Node.js baseline is now 18 or later.

### Removed

- The classic `Shopier` checkout form API, `verifyCallback`, checkout credential resolvers, and classic callback documentation.
- Classic checkout and callback examples.

### Migration

- This is a breaking release. Replace the classic checkout API key/secret flow with `ShopierApiClient` and `ShopierPaymentFlow`; replace classic callback handling with REST webhooks or OSB. See [the v2 migration guide](./docs/migration-v2.md).

## [1.0.1] - 2026-06-18

### Added

- OSB verification and payload parsing helpers.
- Guarded PAT API client surface for future Shopier API support.
- Guarded new webhook surface until the developer portal signature schema is confirmed.
- Callback normalization tests for optional fields and raw payload preservation.

### Fixed

- Callback validation edge case where optional callback fields could be assumed present.
- Checkout regression coverage for `platform_order_id`, `buyer_id_nr`, and deterministic signature input.

## [1.0.0] - 2026-05-02

### Added

- Initial TypeScript SDK for Shopier checkout form generation.
- HMAC-SHA256 signature generation and callback verification.
- Timing-safe signature comparison.
- XSS-safe HTML form rendering.
- Amount, buyer, installment, API key, and API secret validation.
- Express, Next.js, Vue, and basic usage examples.
