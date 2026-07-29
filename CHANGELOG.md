# Changelog

All notable changes to `@nopeion/shopier` are documented in this file. Releases should also be mirrored in GitHub Releases.

## [Unreleased]

### Added

- Automatic retries in `ShopierApiClient` for transient failures: HTTP 408, 429, 500, 502, 503, 504, timeouts, and network errors. Backoff is exponential with jitter and honours a `Retry-After` header when Shopier sends one.
- `retry` options on both the client config and individual requests: `maxRetries`, `baseDelayMs`, `maxDelayMs`, `retryNonIdempotent`, `shouldRetry`, and `onRetry`. Exported as `ShopierRetryOptions`, `ShopierRetryContext`, and `ShopierFailureReason`.
- `error.details.reason` on API errors, distinguishing `http`, `timeout`, `aborted`, and `network` failures.
- Idempotency key support: every `create` method (`refunds.create`, `products.create`, `categories.create`, and so on, plus the `createRefund`/`createProduct`/`createWebhook` convenience methods) accepts a second `{ idempotencyKey }` argument, sent as the `Idempotency-Key` header. Supplying one also makes that POST eligible for retry, without needing `retryNonIdempotent`. `createIdempotencyKey()` generates one. Exported as `ShopierCreateOptions`.

### Fixed

- `client.variations.list()` now forwards its pagination parameters. The method accepted `limit`, `page`, and `sort` in its type signature but silently discarded them.

- A caller-supplied `AbortSignal` no longer leaks one listener per request, and cancelling now reports `Shopier API request was aborted` instead of misreporting a timeout.

### Changed

- `npm test` now runs with coverage and enforces the thresholds, so a coverage regression fails CI instead of passing unnoticed.
- Requests are retried by default (`maxRetries: 2`). Idempotent calls that previously failed on a transient error now succeed after a short wait. Set `retry: { maxRetries: 0 }` to restore the old single-attempt behaviour. POST is not retried unless you opt in.

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
