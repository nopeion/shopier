# Changelog

All notable changes to `@nopeion/shopier` will be documented in this file.

The format follows Keep a Changelog style, and releases should also be mirrored in GitHub Releases.

## [Unreleased]

### Added

- Security policy and payment integration safety guidance.
- GitHub Actions CI matrix for Node.js 16, 18, 20, and 22.
- Dedicated docs for getting started, callbacks, security, Next.js, and Express.
- API compatibility table and visible test coverage summary in the README.
- Nested checkout playground repo for testing checkout form generation with local package builds.

### Changed

- `npm run lint` now runs TypeScript validation so CI works without undeclared ESLint dependencies.

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
