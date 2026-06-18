# Callbacks

Shopier sends classic payment callbacks after checkout. Always verify the callback before fulfilling an order.

## Verify a Callback

```ts
import { Shopier } from '@nopeion/shopier';

const shopier = new Shopier({
  apiKey: process.env.SHOPIER_API_KEY!,
  apiSecret: process.env.SHOPIER_API_SECRET!,
});

const result = shopier.verifyCallback(req.body);

if (!result.success) {
  throw new Error(`Payment failed: ${result.status}`);
}
```

`verifyCallback` throws `SignatureValidationError` when the provider signature is invalid. Treat this as a hard failure.

## Idempotency Example

Callbacks may be retried. Store processed provider identifiers before delivering credits or products.

```ts
const processedPayments = new Set<string>();

function fulfillPayment(result: { paymentId?: string; platformOrderId: string }) {
  const idempotencyKey = result.paymentId ?? result.platformOrderId;

  if (processedPayments.has(idempotencyKey)) {
    return 'already-processed';
  }

  processedPayments.add(idempotencyKey);
  // Deliver product, grant credits, or update order state here.
  return 'processed';
}
```

Use a database-level unique index or transaction in production; the `Set` example is only for showing the control flow.

## Useful Fields

| Field | Meaning |
| ----- | ------- |
| `success` | `true` only when status is `success` and the signature is valid. |
| `platformOrderId` | Your merchant-side order id sent as `platform_order_id`. |
| `paymentId` | Shopier payment id when present. |
| `raw` | Original callback body for logging and reconciliation. |
