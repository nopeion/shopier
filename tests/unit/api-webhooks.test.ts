import {
  ShopierApiClient,
  ShopierApiUnsupportedOperationError,
  ValidationError,
  parseWebhookEvent,
  verifyWebhook,
} from '../../src';

describe('PAT API and new webhook guarded surfaces', () => {
  it('should require a personal access token', () => {
    expect(() => new ShopierApiClient({ personalAccessToken: '' })).toThrow(ValidationError);
  });

  it('should expose guarded orders helpers until developer schema is confirmed', async () => {
    const client = new ShopierApiClient({ personalAccessToken: 'pat-token' });

    await expect(client.orders.get('order-1')).rejects.toThrow(ShopierApiUnsupportedOperationError);
    await expect(client.orders.list()).rejects.toThrow(
      'developer portal schema is required'
    );
  });

  it('should guard webhook verification until signature schema is confirmed', () => {
    expect(() =>
      verifyWebhook({
        headers: {},
        body: '{}',
        secret: 'secret',
      })
    ).toThrow(ShopierApiUnsupportedOperationError);
  });

  it('should guard webhook parsing until payload schema is confirmed', () => {
    expect(() => parseWebhookEvent({ type: 'order.paid' })).toThrow(
      ShopierApiUnsupportedOperationError
    );
  });
});
