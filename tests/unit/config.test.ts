import { resolveOsbCredentials, resolvePatCredentials } from '../../src';
import { ValidationError } from '../../src/errors';

describe('credential resolvers', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.SHOPIER_PAT;
    delete process.env.SHOPIER_PERSONAL_ACCESS_TOKEN;
    delete process.env.SHOPIER_ACCESS_TOKEN;
    delete process.env.SHOPIER_PAT_PRIMARY;
    delete process.env.SHOPIER_PRIMARY_PAT;
    delete process.env.SHOPIER_PRIMARY_PERSONAL_ACCESS_TOKEN;
    delete process.env.SHOPIER_OSB_USERNAME;
    delete process.env.SHOPIER_OSB_PASSWORD;
    delete process.env.SHOPIER_OSB_PRIMARY_USERNAME;
    delete process.env.SHOPIER_OSB_PRIMARY_PASSWORD;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should resolve default PAT credentials from environment', () => {
    process.env.SHOPIER_PAT = 'pat-token';

    expect(resolvePatCredentials()).toEqual({
      personalAccessToken: 'pat-token',
    });
  });

  it('should resolve named PAT credentials from environment', () => {
    process.env.SHOPIER_PAT_PRIMARY = 'primary-token';

    expect(resolvePatCredentials({ credentialName: 'primary' })).toEqual({
      personalAccessToken: 'primary-token',
    });
  });

  it('should resolve explicit PAT credentials first', () => {
    process.env.SHOPIER_PAT = 'env-token';

    expect(resolvePatCredentials({ personalAccessToken: 'explicit-token' })).toEqual({
      personalAccessToken: 'explicit-token',
    });
  });

  it('should throw when PAT credentials are missing', () => {
    expect(() => resolvePatCredentials()).toThrow(ValidationError);
  });

  it('should resolve default OSB credentials from environment', () => {
    process.env.SHOPIER_OSB_USERNAME = 'osb-user';
    process.env.SHOPIER_OSB_PASSWORD = 'osb-password';

    expect(resolveOsbCredentials()).toEqual({
      username: 'osb-user',
      password: 'osb-password',
    });
  });

  it('should resolve named OSB credentials from environment', () => {
    process.env.SHOPIER_OSB_PRIMARY_USERNAME = 'osb-user';
    process.env.SHOPIER_OSB_PRIMARY_PASSWORD = 'osb-password';

    expect(resolveOsbCredentials({ credentialName: 'primary' })).toEqual({
      username: 'osb-user',
      password: 'osb-password',
    });
  });

  it('should throw when OSB credentials are incomplete', () => {
    process.env.SHOPIER_OSB_USERNAME = 'osb-user';

    expect(() => resolveOsbCredentials()).toThrow(ValidationError);
  });
});
