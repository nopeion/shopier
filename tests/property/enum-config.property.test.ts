import * as fc from 'fast-check';
import { Currency, Language, ProductType, PlatformType, WebsiteIndex } from '../../src/enums';

/**
 * **Feature: shopier-sdk, Property 1: Enum Configuration Consistency**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6**
 * 
 * For any valid enum value (Currency, Language, ProductType, PlatformType, WebsiteIndex),
 * the enum SHALL contain the corresponding numeric value as specified in the requirements.
 */
describe('Property 1: Enum Configuration Consistency', () => {
  // Currency enum values as specified in Requirements 2.1
  const currencyValues = [
    { key: 'TL', value: 0 },
    { key: 'USD', value: 1 },
    { key: 'EUR', value: 2 }
  ];

  // Language enum values as specified in Requirements 2.2
  const languageValues = [
    { key: 'TR', value: 0 },
    { key: 'EN', value: 1 }
  ];

  // ProductType enum values as specified in Requirements 2.3
  const productTypeValues = [
    { key: 'REAL_OBJECT', value: 0 },
    { key: 'DOWNLOADABLE_VIRTUAL', value: 1 },
    { key: 'DEFAULT', value: 2 }
  ];

  // PlatformType enum values as specified in Requirements 2.6
  const platformTypeValues = [
    { key: 'IN_FRAME', value: 0 },
    { key: 'NOT_IN_FRAME', value: 1 }
  ];

  // WebsiteIndex enum values as specified in Requirements 2.5
  const websiteIndexValues = [
    { key: 'SITE_1', value: 1 },
    { key: 'SITE_2', value: 2 },
    { key: 'SITE_3', value: 3 },
    { key: 'SITE_4', value: 4 },
    { key: 'SITE_5', value: 5 }
  ];

  it('Currency enum should have correct numeric values for all currency types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...currencyValues),
        ({ key, value }) => {
          const enumValue = Currency[key as keyof typeof Currency];
          return enumValue === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Language enum should have correct numeric values for all language types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...languageValues),
        ({ key, value }) => {
          const enumValue = Language[key as keyof typeof Language];
          return enumValue === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ProductType enum should have correct numeric values for all product types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...productTypeValues),
        ({ key, value }) => {
          const enumValue = ProductType[key as keyof typeof ProductType];
          return enumValue === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('PlatformType enum should have correct numeric values for all platform types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...platformTypeValues),
        ({ key, value }) => {
          const enumValue = PlatformType[key as keyof typeof PlatformType];
          return enumValue === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('WebsiteIndex enum should have correct numeric values for all website indices', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...websiteIndexValues),
        ({ key, value }) => {
          const enumValue = WebsiteIndex[key as keyof typeof WebsiteIndex];
          return enumValue === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('All enum values should be valid numbers', () => {
    // Test that all enum values are numbers (not NaN or undefined)
    const allEnumValues = [
      ...Object.values(Currency).filter(v => typeof v === 'number'),
      ...Object.values(Language).filter(v => typeof v === 'number'),
      ...Object.values(ProductType).filter(v => typeof v === 'number'),
      ...Object.values(PlatformType).filter(v => typeof v === 'number'),
      ...Object.values(WebsiteIndex).filter(v => typeof v === 'number')
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...allEnumValues),
        (value) => {
          return typeof value === 'number' && !isNaN(value) && isFinite(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Enum reverse mapping should work correctly for all values', () => {
    // For numeric enums, TypeScript creates reverse mappings
    // This tests that Currency[0] === 'TL', etc.
    fc.assert(
      fc.property(
        fc.constantFrom(...currencyValues),
        ({ key, value }) => {
          return Currency[value] === key;
        }
      ),
      { numRuns: 100 }
    );
  });
});
