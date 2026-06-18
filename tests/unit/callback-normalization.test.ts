import { Shopier, SignatureValidationError } from '../../src';

describe('Callback normalization', () => {
  const shopier = new Shopier({
    apiKey: 'api-key',
    apiSecret: 'api-secret',
  });

  it('should include raw callback body and normalized fields', () => {
    const randomNr = '123456';
    const platformOrderId = 'merchant-order-1';
    const signature = shopier.generateSignature(`${randomNr}${platformOrderId}`);
    const body = {
      random_nr: randomNr,
      platform_order_id: platformOrderId,
      payment_id: 'shopier-payment-1',
      installment: '2',
      status: 'success',
      signature,
      payment_amount: '149.00',
    };

    const result = shopier.verifyCallback(body);

    expect(result).toMatchObject({
      success: true,
      orderId: platformOrderId,
      platformOrderId,
      paymentId: 'shopier-payment-1',
      installment: 2,
      status: 'success',
    });
    expect(result.raw).toBe(body);
  });

  it('should not crash when optional callback fields are missing', () => {
    const randomNr = '123456';
    const platformOrderId = 'merchant-order-2';
    const signature = shopier.generateSignature(`${randomNr}${platformOrderId}`);

    const result = shopier.verifyCallback({
      random_nr: randomNr,
      platform_order_id: platformOrderId,
      status: 'pending',
      signature,
    });

    expect(result.success).toBe(false);
    expect(result.paymentId).toBeUndefined();
    expect(result.installment).toBe(0);
    expect(result.status).toBe('pending');
  });

  it('should keep invalid signature behavior', () => {
    expect(() =>
      shopier.verifyCallback({
        random_nr: '123456',
        platform_order_id: 'merchant-order-3',
        status: 'success',
        signature: 'invalid',
      })
    ).toThrow(SignatureValidationError);
  });
});
