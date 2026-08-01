import { ShopierPaymentFlow, PaymentLinkResult } from '../../src/payments';
import { ShopierApiClient } from '../../src/api/client';
import { ShopierProduct, ShopierCreateProductInput } from '../../src/api/types';

describe('ShopierPaymentFlow.cleanupProducts', () => {
  it('should clean up products in chunked batches of 5', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const deleteMock = jest.fn(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>((resolve) => setImmediate(resolve));
      inFlight -= 1;
    });
    const mockClient = {
      products: {
        delete: deleteMock,
      },
    } as unknown as ShopierApiClient;

    const flow = new ShopierPaymentFlow({ client: mockClient });

    // Test with 12 product IDs to verify multiple chunk iterations (5 + 5 + 2)
    const productIds = Array.from({ length: 12 }, (_, i) => `prod_${i + 1}`);

    const result = await flow.cleanupProducts(productIds);

    expect(result).toEqual(productIds);
    expect(deleteMock).toHaveBeenCalledTimes(12);
    expect(maxInFlight).toBe(5);
    expect(inFlight).toBe(0);
    productIds.forEach((id) => {
      expect(deleteMock).toHaveBeenCalledWith(id);
    });
  });

  it('should handle single string product ID and PaymentLinkResult object input', async () => {
    const deleteMock = jest.fn().mockResolvedValue(undefined);
    const mockClient = {
      products: {
        delete: deleteMock,
      },
    } as unknown as ShopierApiClient;

    const flow = new ShopierPaymentFlow({ client: mockClient });

    await flow.cleanupProducts('prod_single');
    expect(deleteMock).toHaveBeenCalledWith('prod_single');

    const paymentLinkResult: PaymentLinkResult = {
      productId: 'prod_link',
      paymentUrl: 'https://shopier.com/prod_link',
      checkoutHtml: '<html></html>',
      product: { id: 'prod_link' } as ShopierProduct,
      productInput: { title: 'Test', media: [{ type: 'image', url: 'http://img' }] } as ShopierCreateProductInput,
    };
    await flow.cleanupProducts(paymentLinkResult);
    expect(deleteMock).toHaveBeenCalledWith('prod_link');
  });
});
