import { formatShopierDiagnostics, runShopierDiagnostics } from '../../src/diagnostics';

describe('diagnostics helpers', () => {
  it('should pass when required credentials are present', () => {
    const result = runShopierDiagnostics({
      env: {
        SHOPIER_PAT: 'pat',
        SHOPIER_WEBHOOK_TOKEN: 'webhook',
        SHOPIER_SHOP_SLUG: 'shop',
      },
      require: ['pat', 'webhook', 'shopSlug'],
    });

    expect(result.ok).toBe(true);
    expect(result.counts.fail).toBe(0);
  });

  it('should flag invalid product image URLs', () => {
    const result = runShopierDiagnostics({
      env: {},
      require: ['imageUrl'],
      imageUrl: 'https://example.com/cover.png',
    });

    expect(result.ok).toBe(false);
    expect(result.checks[0]).toMatchObject({
      id: 'imageUrl',
      status: 'fail',
    });
  });

  it('should format a readable doctor report', () => {
    const result = runShopierDiagnostics({
      env: {},
      require: ['pat'],
    });

    expect(formatShopierDiagnostics(result)).toContain('[fail] PAT credentials');
  });
});
