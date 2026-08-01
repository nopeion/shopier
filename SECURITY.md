# Security Policy

## Reporting a Vulnerability

If you believe you found a vulnerability in `@nopeion/shopier`, please do not open a public issue with exploitable details.

Report it privately by emailing nopeiondev@gmail.com with:

- a short description of the issue,
- affected package version,
- reproduction steps or proof of concept,
- impact assessment, if known.

You should receive an initial response within 72 hours. Valid reports will be handled with a fix, release notes, and a GitHub Security Advisory when appropriate.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 2.x     | Yes       |
| 1.x     | No        |
| < 1.0   | No        |

## Handling Shopier Credentials

- Never expose PATs, webhook tokens, or OSB passwords in frontend code.
- Only create PAT checkout flows and REST API calls on a trusted server.
- Keep `.env` files out of git and deployment logs.
- Treat Personal Access Tokens like passwords; rotate them if they are logged or shared.

## Webhook and OSB Safety

- Always verify REST webhook or OSB signatures before delivering a product, credit, or entitlement.
- The SDK utilizes hardened JSON parsing by default. It actively filters `__proto__`, `constructor`, and `prototype` keys from incoming Webhook and OSB payloads, nullifying Prototype Pollution vectors.
- Treat invalid signatures as a hard failure.
- Make webhook and OSB processing idempotent. Shopier or the network may retry notifications.
- Use stable provider identifiers such as webhook id, Shopier order id, or OSB order id to prevent duplicate fulfillment.
- Return the literal `success` body only after OSB verification and your own fulfillment logic have safely completed.

## Disclosure Scope

This package helps create PAT-based checkout flows and verify Shopier REST webhook and OSB notifications. Application-level authorization, database transactions, product delivery, refunds, and account recovery remain the responsibility of the integrating application.
