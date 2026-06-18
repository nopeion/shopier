# Security Guide

Payment integrations are security-sensitive. Keep the trust boundary simple: all Shopier operations that require secrets must run on the server.

## Secrets

- `SHOPIER_API_SECRET` signs checkout and verifies callbacks.
- `SHOPIER_OSB_PASSWORD` verifies OSB hashes.
- `SHOPIER_PAT` is for Shopier API access and must not be used as a checkout secret.

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

## What This Package Does Not Do

- It does not store orders.
- It does not grant credits.
- It does not handle refunds or cancellations.
- It does not replace your application authorization checks.
