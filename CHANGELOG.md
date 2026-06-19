# Changelog

All notable changes to `@nopeion/shopier` are documented in this file. Releases should also be mirrored in GitHub Releases.

## [Unreleased]

No unreleased changes.

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
