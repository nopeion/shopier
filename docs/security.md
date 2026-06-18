# Security Guide

Payment integrations are security-sensitive. Keep the trust boundary simple: all Shopier operations that require secrets must run on the server.

## Secrets

- `SHOPIER_API_SECRET` signs checkout and verifies callbacks.
- `SHOPIER_OSB_PASSWORD` verifies OSB hashes.
- `SHOPIER_PAT` is for Shopier API access and must not be used as a checkout secret.
- `SHOPIER_WEBHOOK_TOKEN` verifies REST webhook notifications.

Never put these values in frontend JavaScript, static HTML, screenshots, logs, or support tickets.

## Callback Verification

- Call `verifyCallback` before fulfilling anything.
- Reject invalid signatures.
- Keep raw callback logs redacted.
- Use idempotency keys to avoid duplicate fulfillment.

## OSB Verification

OSB uses `res` plus `hash`. The package verifies:

```txt
HMAC_SHA256(res + username, password)
```

Only return `success` after verification and after your application has safely handled the event.

## REST API and Refunds

PAT calls can list orders, fetch transactions, create refunds, and manage other Shopier resources. Keep those calls server-side and store your own audit trail for actions such as refunds or fulfillment.

Refund creation through the SDK only sends the Shopier API request. Your application must still validate authorization, enforce business rules, and prevent duplicate refund attempts.

## REST Webhook Verification

REST webhooks use HMAC-SHA256 over the raw request body. Parse JSON only after verification:

```ts
const event = verifyAndParseWebhook({
  webhookToken: process.env.SHOPIER_WEBHOOK_TOKEN,
  headers: req.headers,
  body: rawBody,
});
```

## What This Package Does Not Do

- It does not store orders.
- It does not grant credits.
- It does not decide whether a refund or cancellation is allowed.
- It does not replace your application authorization checks.
