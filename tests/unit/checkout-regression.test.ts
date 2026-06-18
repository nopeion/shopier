import { createHmac } from 'crypto';
import { Currency, Shopier } from '../../src';

describe('Checkout regression behavior', () => {
  it('should map platformOrderId to platform_order_id and buyer id to buyer_id_nr', () => {
    const shopier = new Shopier({
      apiKey: 'api-key',
      apiSecret: 'api-secret',
    });

    const result = shopier.createPayment({
      amount: 149,
      currency: Currency.TL,
      randomNr: 123456,
      buyer: {
        id: 'buyer-context-id',
        platformOrderId: 'checkout-id',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '05000000000',
        productName: 'Premium',
      },
    });

    expect(result.formData.platform_order_id).toBe('checkout-id');
    expect(result.formData.buyer_id_nr).toBe('buyer-context-id');
  });

  it('should keep the existing amount and signature string contract', () => {
    const apiSecret = 'api-secret';
    const shopier = new Shopier({
      apiKey: 'api-key',
      apiSecret,
    });

    const result = shopier.createPayment({
      amount: 149,
      currency: Currency.TL,
      randomNr: 123456,
      buyer: {
        id: 'buyer-id',
        platformOrderId: 'checkout-id',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '05000000000',
        productName: 'Premium',
      },
    });
    const expectedSignature = createHmac('sha256', apiSecret)
      .update('123456checkout-id1490')
      .digest('base64');

    expect(result.formData.total_order_value).toBe(149);
    expect(result.formData.signature).toBe(expectedSignature);
  });
});
